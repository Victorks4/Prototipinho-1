<?php
/**
 * LOGIN SIMPLES - HEMOBYTE
 * Versão simplificada sem validações complexas
 */

// Headers básicos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Se for OPTIONS, retorna OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Só aceita POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

// Pegar dados do POST
$email = $_POST['email'] ?? '';
$senha = $_POST['senha'] ?? '';

// Validação básica
if (empty($email) || empty($senha)) {
    echo json_encode(['error' => 'Email e senha são obrigatórios']);
    exit;
}

try {
    // Conectar ao banco
    $pdo = new PDO("mysql:host=localhost;dbname=doacoes;charset=utf8mb4", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Buscar usuário
    $stmt = $pdo->prepare("SELECT id, nome, email, telefone, senha FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($usuario && password_verify($senha, $usuario['senha'])) {
        // Login OK
        session_start();
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        
        unset($usuario['senha']); // Remove senha da resposta
        
        echo json_encode([
            'success' => true,
            'user' => $usuario
        ]);
        
    } else {
        echo json_encode(['error' => 'Email ou senha incorretos']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erro no banco de dados: ' . $e->getMessage()]);
}
?>
