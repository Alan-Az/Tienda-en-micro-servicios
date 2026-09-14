<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClienteController;

/*
|--------------------------------------------------------------------------
| API Routes - Portal de Clientes y Autenticación JWT
|--------------------------------------------------------------------------
*/

// Rutas Públicas de Autenticación
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Rutas de Clientes protegidas por JWT
Route::prefix('clientes')->group(function () {
    Route::get('/perfil', [ClienteController::class, 'perfil']);
    Route::get('/compras', [ClienteController::class, 'compras']);
});
