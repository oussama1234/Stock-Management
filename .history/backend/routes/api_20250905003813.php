<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::middleware(['web', 'auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['web','auth:sanctum'])->group(function () {
    // Add your protected routes here
    Route::post('/profile/update', [UserController::class, 'update']);
});

require __DIR__.'/auth.php';