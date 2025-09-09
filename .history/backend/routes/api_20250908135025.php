<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;




// list of all the protected routes for authenticating users api
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/profile/update', [UserController::class, 'updateProfile']);
    Route::apiResource('users', UserController::class);
});

    // Add your protected routes here
    // routes/web.php




require __DIR__.'/auth.php';