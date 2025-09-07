<?php
/**
 * API para cadastro de participantes em campanhas
 * Melhorias de segurança implementadas
 */

session_start();

// Configurações de segurança
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Configurações do banco (mesmas do sistema existente)
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
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Função para validar email
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Função para validar telefone brasileiro
function validatePhone($phone) {
    $pattern = '/^\(\d{2}\)\s\d{4,5}-\d{4}$/';
    return preg_match($pattern, $phone);
}

// Função para validar idade
function validateAge($age) {
    return is_numeric($age) && $age >= 16 && $age <= 70;
}

// Função para validar tipo sanguíneo
function validateBloodType($type) {
    $validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return in_array($type, $validTypes);
}

// Verifica se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

// Verifica token CSRF (se fornecido)
$headers = getallheaders();
if (isset($headers['X-CSRF-Token'])) {
    // Aqui você pode implementar validação do token CSRF
    // Por enquanto, apenas registra que foi fornecido
    error_log('CSRF Token fornecido: ' . substr($headers['X-CSRF-Token'], 0, 10) . '...');
}

// Recebe e sanitiza dados do formulário
$nome = sanitizeInput($_POST['nome'] ?? '');
$email = sanitizeInput($_POST['email'] ?? '');
$telefone = sanitizeInput($_POST['telefone'] ?? '');
$idade = sanitizeInput($_POST['idade'] ?? '');
$tipo_sanguineo = sanitizeInput($_POST['tipo_sanguineo'] ?? '');
$campanha_id = (int)($_POST['campanha_id'] ?? 0);

// Array para armazenar erros de validação
$errors = [];

// Validações
if (empty($nome) || strlen($nome) < 2) {
    $errors[] = 'Nome deve ter pelo menos 2 caracteres';
}

if (empty($email) || !validateEmail($email)) {
    $errors[] = 'Email inválido';
}

if (empty($telefone) || !validatePhone($telefone)) {
    $errors[] = 'Telefone inválido. Use o formato (XX) XXXXX-XXXX';
}

if (empty($idade) || !validateAge($idade)) {
    $errors[] = 'Idade deve estar entre 16 e 70 anos';
}

if (empty($tipo_sanguineo) || !validateBloodType($tipo_sanguineo)) {
    $errors[] = 'Tipo sanguíneo inválido';
}

if ($campanha_id <= 0) {
    $errors[] = 'ID da campanha inválido';
}

// Se há erros, retorna eles
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'errors' => $errors
    ]);
    exit;
}

try {
    // Verifica se o email já está cadastrado nesta campanha
    $stmt = $pdo->prepare("SELECT id FROM participantes WHERE email = ? AND campanha_id = ?");
    $stmt->execute([$email, $campanha_id]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Você já está cadastrado nesta campanha'
        ]);
        exit;
    }

    // Insere o participante no banco
    $stmt = $pdo->prepare("
        INSERT INTO participantes (nome, email, telefone, idade, tipo_sanguineo, campanha_id) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([$nome, $email, $telefone, $idade, $tipo_sanguineo, $campanha_id]);
    
    $participante_id = $pdo->lastInsertId();
    
    // Log da ação para auditoria
    error_log("Novo participante cadastrado: ID $participante_id, Email: $email, Campanha: $campanha_id");
    
    // Retorna sucesso
    echo json_encode([
        'success' => true,
        'message' => 'Participação confirmada com sucesso!',
        'participante_id' => $participante_id,
        'data' => [
            'nome' => $nome,
            'email' => $email,
            'telefone' => $telefone,
            'idade' => (int)$idade,
            'tipo_sanguineo' => $tipo_sanguineo,
            'campanha_id' => $campanha_id
        ]
    ]);

} catch (\PDOException $e) {
    // Log do erro para debugging
    error_log('Erro ao cadastrar participante: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro interno do servidor. Tente novamente.'
    ]);
}
?>