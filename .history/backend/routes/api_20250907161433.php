<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;





Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/profile/update', [UserController::class, 'updateProfile']);
});

    // Add your protected routes here
    // routes/web.php




require __DIR__.'/auth.php';