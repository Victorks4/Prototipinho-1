<?php


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
$nome = $_POST['nome'] ?? '';
$email = $_POST['email'] ?? '';
$telefone = $_POST['telefone'] ?? '';
$senha = $_POST['senha'] ?? '';

// Validação básica
if (empty($nome) || empty($email) || empty($telefone) || empty($senha)) {
    echo json_encode(['error' => 'Todos os campos são obrigatórios']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Email inválido']);
    exit;
}

if (strlen($senha) < 6) {
    echo json_encode(['error' => 'Senha deve ter pelo menos 6 caracteres']);
    exit;
}

try {
    // Conectar ao banco
    $pdo = new PDO("mysql:host=localhost;dbname=doacoes;charset=utf8mb4", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar se email já existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo json_encode(['error' => 'Email já está cadastrado']);
        exit;
    }
    
    // Inserir novo usuário
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nome, $email, $telefone, $senha_hash]);
    
    // Pegar dados do usuário criado
    $user_id = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user_id,
            'nome' => $nome,
            'email' => $email,
            'telefone' => $telefone
        ]
    ]);
    
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(['error' => 'Email já está cadastrado']);
    } else {
        echo json_encode(['error' => 'Erro no banco de dados: ' . $e->getMessage()]);
    }
}
?>

