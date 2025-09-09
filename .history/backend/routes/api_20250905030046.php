<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;


Route::middleware(['web', 'auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});


    // Add your protected routes here
    // routes/web.php
Route::middleware(['auth:sanctum', 'web'])->post('/profile/update', [UserController::class, 'updateProfile']);



require __DIR__.'/auth.php';