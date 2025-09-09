<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function updateProfile(UserRequest $request)
    {
        $user = Auth::user();

        //pull the password from user and crypt it to see if it matches the request->currentPassword, the bcrypt the new password 
        // save also other data name, email and profileImage
        
        $rules = $request->validated($request);

        dd($rules);

    }
}
