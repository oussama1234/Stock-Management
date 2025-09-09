<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function updateProfile(UserRequest $request)
    {
        $user = Auth::user();

        
        //validate the request

        $validated = $request->validated();

        //check if the current password matches the user's password and if not return a message, else save the new password 
        if(!empty($validated['currentPassword']) && !empty($validated['newPassword']))
        {
            if(!Hash::check($validated['currentPassword'],$user->password))
            {
                return response()->json(
                    [
                    'message' => 'Wrong Current Password'
                    ]
                );
            }

            $user->password = $validated['newPassword'];
        }

    }
}
