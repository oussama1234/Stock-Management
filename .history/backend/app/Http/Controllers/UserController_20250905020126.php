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
        
        $rules = $request->validated($request);

    }
}
