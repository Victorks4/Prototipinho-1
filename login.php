<?php
/**
 * Sistema de Login - HemoByte
 * Melhorias de segurança implementadas
 */

session_start();

// Configurações de segurança
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Configurações do banco
$host = 'localhost';
$db   = 'doacoes';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao conectar ao banco de dados']);
    exit;
}

// Função para sanitizar dados de entrada
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Função para registrar tentativas de login
function logLoginAttempt($email, $success, $ip) {
    $logFile = 'logs/login_attempts.log';
    $timestamp = date('Y-m-d H:i:s');
    $status = $success ? 'SUCCESS' : 'FAILED';
    $logEntry = "[$timestamp] $status - Email: $email - IP: $ip\n";
    
    // Cria diretório de logs se não existir
    if (!is_dir('logs')) {
        mkdir('logs', 0755, true);
    }
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Verifica se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

// Obtém IP do cliente
$clientIP = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Recebe e sanitiza dados do formulário
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$senha = sanitizeInput($_POST['senha'] ?? '');

// Validações
$errors = [];

if (!$email) {
    $errors[] = 'Email inválido';
}

if (empty($senha)) {
    $errors[] = 'Senha é obrigatória';
}

if (strlen($senha) < 6) {
    $errors[] = 'Senha deve ter pelo menos 6 caracteres';
}

if (!empty($errors)) {
    logLoginAttempt($email ?: 'email_inválido', false, $clientIP);
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit;
}

try {
    // Busca usuário pelo email
    $stmt = $pdo->prepare("SELECT id, nome, email, telefone, senha FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if ($usuario && password_verify($senha, $usuario['senha'])) {
        // Login bem-sucedido
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        $_SESSION['usuario_email'] = $usuario['email'];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();

        // Remove a senha antes de enviar os dados do usuário
        unset($usuario['senha']);

        // Log da tentativa bem-sucedida
        logLoginAttempt($email, true, $clientIP);

        echo json_encode([
            'success' => true,
            'message' => 'Login realizado com sucesso!',
            'user' => $usuario
        ]);
    } else {
        // Log da tentativa falhada
        logLoginAttempt($email, false, $clientIP);
        
        http_response_code(401);
        echo json_encode(['error' => 'Email ou senha incorretos']);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao realizar login']);
}
?>
