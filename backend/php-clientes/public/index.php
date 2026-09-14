<?php

// Front Controller ligero compatible con standalone PHP Built-in Server y Docker
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Manejo simplificado de rutas API para ejecución directa o containerizada
if (strpos($uri, '/api/auth/login') !== false && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (($email === 'admin@retail.com' || $email === 'cliente@retail.com') && $password === 'Password123!') {
        $nombre = $email === 'admin@retail.com' ? 'Administrador Retail' : 'Juan Pérez';
        $puntos = $email === 'admin@retail.com' ? 500 : 120;
        $id = $email === 'admin@retail.com' ? 1 : 2;

        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode([
            'sub' => $id,
            'nombre' => $nombre,
            'email' => $email,
            'puntos_lealtad' => $puntos,
            'iat' => time(),
            'exp' => time() + 86400
        ]));
        $secret = getenv('JWT_SECRET') ?: 'ClaveSecretaCompartidaERPRetail2026!';
        $signature = hash_hmac('sha256', "$header.$payload", $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        $token = "$header.$payload.$base64UrlSignature";

        header('Content-Type: application/json');
        echo json_encode([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => 86400,
            'user' => [
                'id' => $id,
                'nombre' => $nombre,
                'email' => $email,
                'puntos_lealtad' => $puntos
            ]
        ]);
        exit;
    } else {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Credenciales inválidas. Usa cliente@retail.com o admin@retail.com con Password123!']);
        exit;
    }
}

if (strpos($uri, '/api/clientes/perfil') !== false && $method === 'GET') {
    header('Content-Type: application/json');
    echo json_encode([
        'id' => 2,
        'nombre' => 'Juan Pérez',
        'email' => 'cliente@retail.com',
        'puntos_lealtad' => 120,
        'nivel' => 'Plata'
    ]);
    exit;
}

if (strpos($uri, '/api/clientes/compras') !== false && $method === 'GET') {
    header('Content-Type: application/json');
    echo json_encode([
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
    exit;
}

// 404 por defecto
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'Ruta no encontrada', 'uri' => $uri]);
