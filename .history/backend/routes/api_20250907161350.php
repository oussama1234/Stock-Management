<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;


Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});


Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

    // Add your protected routes here
    // routes/web.php
Route::middleware(['auth:sanctum'])->post('/profile/update', [UserController::class, 'updateProfile']);



require __DIR__.'/auth.php';