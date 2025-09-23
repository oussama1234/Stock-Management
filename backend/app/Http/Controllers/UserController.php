<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use App\Support\CacheHelper; // Namespaced cache helper for invalidation
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function updateProfile(UserRequest $request)
    {
        $user = User::find(Auth::user()->id)->first();

        //validate the request
        $validated = $request->validated();

        //check if the current password matches the user's password and if not return a message, else save the new password 
        if(!empty($validated['currentPassword']) && !empty($validated['newPassword']))
        {
            if(!Hash::check($validated['currentPassword'],$user->password))
            {
                 return response()->json([
                'message' => 'Current password is incorrect'
                ], 422);
            }

            $user->password = $validated['newPassword'];
        }

        // Update basic profile fields
        if(!empty($validated['name'])) {
            $user->name = $validated['name'];
        }

        if(!empty($validated['email'])) {
            $user->email = $validated['email'];
        }

        // Update new profile fields
        $profileFields = ['phone', 'bio', 'location', 'website', 'job_title', 'description', 'two_factor_enabled'];
        foreach ($profileFields as $field) {
            if (isset($validated[$field])) {
                $user->{$field} = $validated[$field];
            }
        }

        // Handle profile image upload
        if($request->hasFile('profileImage')) {
            $path = $user->uploadProfileImage($request);
            $user->profileImage = $path;
        }

        // Handle avatar upload (separate from profileImage)
        if($request->hasFile('avatar')) {
            // Remove old avatar
            if ($user->avatar) {
                $relativePath = str_replace(asset('storage') . '/', '', $user->avatar);
                Storage::disk('public')->delete($relativePath);
            }
            
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = asset('storage/' . $avatarPath);
        }

        $user->profile_updated_at = now();
        $user->save();

        // Invalidate cached users list so next reads reflect the update
        CacheHelper::bump('users');
        
        // Also clear user preferences cache since profile updated
        $prefCacheKey = CacheHelper::key('user_preferences', $user->id);
        Cache::forget($prefCacheKey);

        return response()->json([
            'message' => 'Profile Updated Successfully',
            'user' => $user->load('preferences'),
        ], 200);
    }

    public function index(Request $request)
    {
        // Get pagination parameters
        $perPage = min(100, max(1, (int) $request->get('per_page', 20))); // Default 20, max 100
        $page = max(1, (int) $request->get('page', 1));
        $search = $request->get('search', '');
        $role = $request->get('role', '');
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        // Create cache key that includes all parameters
        $cacheParams = [
            'per_page' => $perPage,
            'page' => $page,
            'search' => $search,
            'role' => $role,
            'sort_by' => $sortBy,
            'sort_order' => $sortOrder,
        ];
        
        $key = CacheHelper::key('users', 'paginated', $cacheParams);
        $ttl = CacheHelper::ttlSeconds('API_USERS_TTL', 300); // 5 minutes for paginated results
        
        $result = Cache::remember($key, now()->addSeconds($ttl), function () use (
            $perPage, $search, $role, $sortBy, $sortOrder
        ) {
            $query = User::query()
                ->select([
                    'id', 'name', 'email', 'role', 'profileImage', 'avatar', 
                    'phone', 'job_title', 'location', 'bio', 'website', 'two_factor_enabled',
                    'created_at', 'updated_at', 'profile_updated_at'
                ])
                ->withCount(['sales', 'purchases']); // Add relationship counts
            
            // Apply search filter
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('job_title', 'like', "%{$search}%")
                      ->orWhere('location', 'like', "%{$search}%")
                      ->orWhere('bio', 'like', "%{$search}%")
                      ->orWhere('website', 'like', "%{$search}%");
                });
            }
            
            // Apply role filter
            if (!empty($role)) {
                $query->where('role', $role);
            }
            
            // Apply sorting
            $allowedSorts = ['name', 'email', 'role', 'created_at', 'updated_at', 'profile_updated_at'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
            }
            
            return $query->paginate($perPage);
        });
        
        return response()->json($result);
    }

    // storing new User with its profileImage function that is already been created

    public function store(UserRequest $request)
    {
        // validating the request data, if the data is not valid return a message

        $validated = $request->validated();

        //check if email is already stored

        if(User::where('email', $validated['email'])->exists())
        {
            return response()->json([
                'message' => 'Email already exists'
            ], 422);
        }
        
        // Creating a new user with all profile fields
        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'user'
        ];
        
        // Add profile fields if provided
        $profileFields = ['phone', 'bio', 'location', 'website', 'job_title', 'two_factor_enabled'];
        foreach ($profileFields as $field) {
            if (isset($validated[$field])) {
                $userData[$field] = $validated[$field];
            }
        }
        
        $user = User::create($userData);

        //uploading and saving the profile image

        if($request->hasFile('profileImage'))
        {
        
            $path = $user->uploadProfileImage($request);

            $user->profileImage = $path;

            $user->save();

        }

        //returning the user

        // Invalidate cached users list so next reads include the new user
        CacheHelper::bump('users');

        return response()->json(
            $user, 200
        );
        
    }

    /**
     * Delete a user by given ID
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {

        $user = User::find($id);
        //
        $user->delete();
        // remove any profile image if available

        $user->removeProfileImage();
       

       // Invalidate cached users list so next reads reflect deletion
       CacheHelper::bump('users');

       return response()->json($user->withoutRelations(), 200);

    }

    public function update(UserRequest $request, $id)
    {

        // validate the request
      
      $validated = $request->validated();

      // find the user by its ID

      $user = User::find($id);

      // update the user basic fields
      $user->name = $validated['name'];
      $user->email = $validated['email'];
      $user->role = $validated['role'];
      
      // Update profile fields
      $profileFields = ['phone', 'bio', 'location', 'website', 'job_title', 'two_factor_enabled'];
      foreach ($profileFields as $field) {
          if (isset($validated[$field])) {
              $user->{$field} = $validated[$field];
          }
      }

      // check if the user has a new password
      if(!empty($validated['password']))
      {
        $user->password = Hash::make($validated['password']);
      }
      
      // Update profile timestamp
      $user->profile_updated_at = now();

      // check if the user has a new profile image
      if($request->hasFile('profileImage'))
      {
        
          $path = $user->uploadProfileImage($request);

          $user->profileImage = $path;
      }
      
      $user->save();

      // Invalidate cached users list so next reads reflect the update
      CacheHelper::bump('users');

      return response()->json(
        $user, 200
      );

    }
}
