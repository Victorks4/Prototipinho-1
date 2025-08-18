<?php
class User {
    private $conn;
    private $table_name = "usuarios";

    public $id;
    public $nome;
    public $email;
    public $telefone;
    public $senha;
    public $data_cadastro;
    public $data_ultimo_login;
    public $ativo;

    public function __construct($db) {
        $this->conn = $db;
    }
//comitarrr
    // Cadastrar novo usuário
    public function create() {
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                      (nome, email, telefone, senha, data_cadastro, ativo) 
                      VALUES (:nome, :email, :telefone, :senha, NOW(), 1)";

            $stmt = $this->conn->prepare($query);

            // Sanitizar dados
            $this->nome = htmlspecialchars(strip_tags(trim($this->nome)));
            $this->email = htmlspecialchars(strip_tags(trim($this->email)));
            $this->telefone = htmlspecialchars(strip_tags(trim($this->telefone)));
            
            // Hash da senha
            $senha_hash = password_hash($this->senha, PASSWORD_BCRYPT);

            // Bind dos parâmetros
            $stmt->bindParam(":nome", $this->nome);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":telefone", $this->telefone);
            $stmt->bindParam(":senha", $senha_hash);

            if($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                return true;
            }
            
            return false;
            
        } catch(PDOException $e) {
            error_log("Erro ao criar usuário: " . $e->getMessage());
            return false;
        }
    }

    // Login
    public function login($email, $senha) {
        try {
            $query = "SELECT id, nome, email, telefone, senha, ativo 
                      FROM " . $this->table_name . " 
                      WHERE email = :email AND ativo = 1 LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":email", $email);
            $stmt->execute();

            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch();
                
                if(password_verify($senha, $row['senha'])) {
                    $this->id = $row['id'];
                    $this->nome = $row['nome'];
                    $this->email = $row['email'];
                    $this->telefone = $row['telefone'];

                    $this->updateLastLogin();
                    return true;
                }
            }
            return false;
            
        } catch(PDOException $e) {
            error_log("Erro no login: " . $e->getMessage());
            return false;
        }
    }

    // Verificar se email já existe
    public function emailExists($email) {
        try {
            $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":email", $email);
            $stmt->execute();
            
            return $stmt->rowCount() > 0;
            
        } catch(PDOException $e) {
            error_log("Erro ao verificar email: " . $e->getMessage());
            return false;
        }
    }

    // Atualizar último login
    private function updateLastLogin() {
        try {
            $query = "UPDATE " . $this->table_name . " 
                      SET data_ultimo_login = NOW() 
                      WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $this->id);
            $stmt->execute();
            
        } catch(PDOException $e) {
            error_log("Erro ao atualizar último login: " . $e->getMessage());
        }
    }

    // Gerar token JWT simples (melhorado)
    public function generateToken() {
        $secret_key = "hemobyte_secret_key_2024_super_secret";
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $this->id,
            'email' => $this->email,
            'nome' => $this->nome,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 horas
        ]);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
}
?>