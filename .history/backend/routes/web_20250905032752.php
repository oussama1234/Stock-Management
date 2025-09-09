<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});



Route::middleware(['auth:sanctum'])->post('/profile/update', [UserController::class, 'updateProfile']);
