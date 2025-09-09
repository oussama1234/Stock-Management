<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function updateProfile(UserRequest $request)
    {
        $user = User::find(Auth::user()->id)->first();

        
        //validate the request

        $validated = $request->validated();

        //dd($validated);

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

        //check if empty and save name, email, profileImage

        if(!empty($validated['name']))
        {
            $user->name = $validated['name'];
        }

        if(!empty($validated['email']))
        {
            $user->email = $validated['email'];
        }

        if($request->hasFile('profileImage'))
        {
        
            $path = $user->uploadProfileImage($request);

            $user->profileImage = $path;

        }

        $user->save();

        return response()->json(
            [
                'message' => 'Profile Updated Successfully',
                'user' => $user,
            ], 200
        );

    }

    public function index()
    {
        return response()->json(
            User::all()
        );
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
        
        // Creating a new user

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role']
        ]);

        //uploading and saving the profile image

        if($request->hasFile('profileImage'))
        {
        
            $path = $user->uploadProfileImage($request);

            $user->profileImage = $path;

            $user->save();

        }

        //returning the user

        return response()->json(
            $user, 200
        );
        
    }

    public function destroy(User $user)
    {

        $user->delete();
        // remove any profile image if available

        $user->removeProfileImage();
       

        return response()->json(
           $user , 200
        );
    }

    public function update(UserRequest $request)
    {
        //
    }
}
