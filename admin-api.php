<?php
/**
 * API Administrativa - HemoByte
 * Gerencia operações administrativas do sistema
 */

// Headers de segurança
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Configuração do banco de dados
$host = 'localhost';
$dbname = 'doacoes';  // ✅ CORRIGIDO: Usar mesmo banco dos outros arquivos
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão com banco de dados']);
    exit;
}

// Função para sanitizar entrada
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Função para verificar autenticação admin
function verifyAdminAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token de autenticação necessário']);
        exit;
    }
    
    // Em produção, verificar token JWT ou sessão
    $token = str_replace('Bearer ', '', $authHeader);
    
    // Verificação simples - em produção usar JWT
    if ($token !== 'admin_token_8080') {
        http_response_code(403);
        echo json_encode(['error' => 'Token inválido']);
        exit;
    }
    
    return true;
}

// Função para log de ações administrativas
function logAdminAction($action, $details = '') {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO admin_logs (action, details, ip_address, timestamp) 
            VALUES (?, ?, ?, NOW())
        ");
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $stmt->execute([$action, $details, $ip]);
    } catch (PDOException $e) {
        // Log error but don't stop execution
        error_log("Failed to log admin action: " . $e->getMessage());
    }
}

// Roteamento baseado no método HTTP e ação
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Verificar autenticação para todas as operações exceto login
if ($action !== 'login') {
    verifyAdminAuth();
}

switch ($method) {
    case 'POST':
        handlePost($action);
        break;
    case 'GET':
        handleGet($action);
        break;
    case 'PUT':
        handlePut($action);
        break;
    case 'DELETE':
        handleDelete($action);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}

function handlePost($action) {
    global $pdo;
    
    switch ($action) {
        case 'login':
            handleAdminLogin();
            break;
            
        case 'approve-campaign':
            $data = json_decode(file_get_contents('php://input'), true);
            $campaignId = sanitizeInput($data['campaignId'] ?? '');
            
            if (empty($campaignId)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID da campanha necessário']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("UPDATE campanhas SET status = 'aprovada', approved_at = NOW() WHERE id = ?");
                $stmt->execute([$campaignId]);
                
                logAdminAction('CAMPAIGN_APPROVED', "Campaign ID: $campaignId");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Campanha aprovada com sucesso'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao aprovar campanha']);
            }
            break;
            
        case 'reject-campaign':
            $data = json_decode(file_get_contents('php://input'), true);
            $campaignId = sanitizeInput($data['campaignId'] ?? '');
            $reason = sanitizeInput($data['reason'] ?? '');
            
            if (empty($campaignId)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID da campanha necessário']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("UPDATE campanhas SET status = 'rejeitada', rejection_reason = ?, rejected_at = NOW() WHERE id = ?");
                $stmt->execute([$reason, $campaignId]);
                
                logAdminAction('CAMPAIGN_REJECTED', "Campaign ID: $campaignId, Reason: $reason");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Campanha rejeitada'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao rejeitar campanha']);
            }
            break;
            
        case 'upload-image':
            handleImageUpload();
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Ação não encontrada']);
            break;
    }
}

function handleGet($action) {
    global $pdo;
    
    switch ($action) {
        case 'campaigns':
            try {
                $stmt = $pdo->prepare("
                    SELECT id, titulo, local, data_campanha, tipo_sanguineo, status, 
                           created_at, approved_at, rejected_at, rejection_reason
                    FROM campanhas 
                    ORDER BY created_at DESC
                ");
                $stmt->execute();
                $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'campaigns' => $campaigns
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao buscar campanhas']);
            }
            break;
            
        case 'users':
            try {
                $stmt = $pdo->prepare("
                    SELECT id, nome, email, telefone, created_at, status
                    FROM usuarios 
                    ORDER BY created_at DESC
                ");
                $stmt->execute();
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'users' => $users
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao buscar usuários']);
            }
            break;
            
        case 'stats':
            try {
                // Total de campanhas aprovadas
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM campanhas WHERE status = 'aprovada'");
                $stmt->execute();
                $totalCampaigns = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Total de usuários
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM usuarios");
                $stmt->execute();
                $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Campanhas pendentes
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM campanhas WHERE status = 'pendente'");
                $stmt->execute();
                $pendingCampaigns = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Total de participações (simulado)
                $totalDonations = 1547; // Pode ser calculado de uma tabela de participações
                
                echo json_encode([
                    'success' => true,
                    'stats' => [
                        'totalCampaigns' => $totalCampaigns,
                        'totalUsers' => $totalUsers,
                        'pendingCampaigns' => $pendingCampaigns,
                        'totalDonations' => $totalDonations
                    ]
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao buscar estatísticas']);
            }
            break;
            
        case 'logs':
            try {
                $stmt = $pdo->prepare("
                    SELECT action, details, ip_address, timestamp
                    FROM admin_logs 
                    ORDER BY timestamp DESC 
                    LIMIT 50
                ");
                $stmt->execute();
                $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'logs' => $logs
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao buscar logs']);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Ação não encontrada']);
            break;
    }
}

function handlePut($action) {
    global $pdo;
    
    switch ($action) {
        case 'campaign':
            $data = json_decode(file_get_contents('php://input'), true);
            $campaignId = sanitizeInput($data['id'] ?? '');
            $titulo = sanitizeInput($data['titulo'] ?? '');
            $local = sanitizeInput($data['local'] ?? '');
            $dataCampanha = sanitizeInput($data['data_campanha'] ?? '');
            $tipoSanguineo = sanitizeInput($data['tipo_sanguineo'] ?? '');
            
            if (empty($campaignId) || empty($titulo)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados obrigatórios não fornecidos']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("
                    UPDATE campanhas 
                    SET titulo = ?, local = ?, data_campanha = ?, tipo_sanguineo = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$titulo, $local, $dataCampanha, $tipoSanguineo, $campaignId]);
                
                logAdminAction('CAMPAIGN_UPDATED', "Campaign ID: $campaignId");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Campanha atualizada com sucesso'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao atualizar campanha']);
            }
            break;
            
        case 'user':
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = sanitizeInput($data['id'] ?? '');
            $status = sanitizeInput($data['status'] ?? '');
            
            if (empty($userId) || empty($status)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados obrigatórios não fornecidos']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("UPDATE usuarios SET status = ? WHERE id = ?");
                $stmt->execute([$status, $userId]);
                
                logAdminAction('USER_STATUS_UPDATED', "User ID: $userId, Status: $status");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Status do usuário atualizado'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao atualizar usuário']);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Ação não encontrada']);
            break;
    }
}

function handleDelete($action) {
    global $pdo;
    
    switch ($action) {
        case 'campaign':
            $campaignId = sanitizeInput($_GET['id'] ?? '');
            
            if (empty($campaignId)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID da campanha necessário']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("DELETE FROM campanhas WHERE id = ?");
                $stmt->execute([$campaignId]);
                
                logAdminAction('CAMPAIGN_DELETED', "Campaign ID: $campaignId");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Campanha excluída com sucesso'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao excluir campanha']);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Ação não encontrada']);
            break;
    }
}

function handleAdminLogin() {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = sanitizeInput($data['username'] ?? '');
    $password = sanitizeInput($data['password'] ?? '');
    
    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Usuário e senha são obrigatórios']);
        return;
    }
    
    // Credenciais administrativas
    if ($username === 'adm' && $password === '8080') {
        $token = 'admin_token_8080'; // Em produção, gerar JWT
        
        logAdminAction('ADMIN_LOGIN', "Successful login for user: $username");
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'username' => 'adm',
                'permissions' => ['manage_campaigns', 'manage_images', 'site_control']
            ]
        ]);
    } else {
        logAdminAction('ADMIN_LOGIN_FAILED', "Failed login attempt for user: $username");
        
        http_response_code(401);
        echo json_encode(['error' => 'Credenciais inválidas']);
    }
}

function handleImageUpload() {
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nenhuma imagem enviada']);
        return;
    }
    
    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validações
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de arquivo não permitido']);
        return;
    }
    
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'Arquivo muito grande (máx. 5MB)']);
        return;
    }
    
    // Criar diretório se não existir
    $uploadDir = 'uploads/images/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Gerar nome único
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_') . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Mover arquivo
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        logAdminAction('IMAGE_UPLOADED', "File: $filename");
        
        echo json_encode([
            'success' => true,
            'message' => 'Imagem enviada com sucesso',
            'filename' => $filename,
            'url' => $filepath
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao salvar imagem']);
    }
}

// Criar tabela de logs se não existir
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
} catch (PDOException $e) {
    // Tabela já existe ou erro de criação
}
?>
