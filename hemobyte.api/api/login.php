<?php
// CORS headers robustos
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Tratar requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
//vqmow domitarrr?????
// Log para debug
error_log("Login endpoint called: " . $_SERVER['REQUEST_METHOD']);

try {
    // Includes
    include_once '../config/database.php';
    include_once '../models/User.php';

    // Instâncias
    $database = new Database();
    $db = $database->getConnection();
    $user = new User($db);

    // Pegar dados JSON
    $json = file_get_contents("php://input");
    error_log("Dados de login recebidos: " . $json);
    
    $data = json_decode($json);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("JSON inválido: " . json_last_error_msg());
    }

    // Validar dados obrigatórios
    if (empty($data->email) || empty($data->senha)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Email e senha são obrigatórios."
        ]);
        exit();
    }

    // Validar formato do email
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Email inválido."
        ]);
        exit();
    }

    // Tentar fazer login
    $email = trim(strtolower($data->email));
    $senha = $data->senha;

    if ($user->login($email, $senha)) {
        $token = $user->generateToken();

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login realizado com sucesso!",
            "token" => $token,
            "user" => [
                "id" => (int)$user->id,
                "nome" => $user->nome,
                "email" => $user->email,
                "telefone" => $user->telefone
            ]
        ]);
        
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Email ou senha incorretos."
        ]);
    }

} catch (Exception $e) {
    error_log("Erro no login.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erro interno do servidor: " . $e->getMessage()
    ]);
}
?>