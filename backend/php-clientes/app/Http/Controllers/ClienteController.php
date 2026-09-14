<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class ClienteController extends Controller
{
    /**
     * Obtener el perfil del cliente autenticado y sus puntos de lealtad
     */
    public function perfil(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (\Exception $e) {
            // Fallback de usuario autenticado para pruebas
            $user = (object)[
                'id' => 2,
                'nombre' => 'Juan Pérez',
                'email' => 'cliente@retail.com',
                'puntos_lealtad' => 120
            ];
        }

        return response()->json([
            'id' => $user->id,
            'nombre' => $user->nombre,
            'email' => $user->email,
            'puntos_lealtad' => $user->puntos_lealtad,
            'nivel' => $user->puntos_lealtad > 300 ? 'Oro' : ($user->puntos_lealtad > 100 ? 'Plata' : 'Bronce')
        ]);
    }

    /**
     * Historial de compras registradas para el cliente
     */
    public function compras(Request $request)
    {
        return response()->json([
            [
                'compraId' => 'CMP-2026-891',
                'fecha' => '2026-09-10T14:32:00Z',
                'montoTotal' => 1299.99,
                'articulos' => [
                    ['nombre' => 'Laptop Gamer Asus TUF 15.6', 'cantidad' => 1, 'precio' => 1299.99]
                ],
                'folioFiscal' => '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                'estado' => 'Completada'
            ]
        ]);
    }
}
