<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

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
                return response()->json(
                    [
                    'message' => 'Current password is incorrect'
                    ], 400
                );
            }

            //$user->password = $validated['newPassword'];
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
            ]
        );

    }
}
