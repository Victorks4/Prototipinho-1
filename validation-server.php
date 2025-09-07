<?php
/**
 * Sistema de Validação Server-Side - HemoByte
 * Validação robusta no servidor para complementar validação client-side
 */

class ValidationServer {
    private $rules = [];
    private $messages = [];
    private $errors = [];
    
    public function __construct() {
        $this->setupDefaultMessages();
    }
    
    /**
     * Configura mensagens padrão
     */
    private function setupDefaultMessages() {
        $this->messages = [
            'required' => 'Este campo é obrigatório',
            'email' => 'Digite um email válido',
            'phone' => 'Digite um telefone válido no formato (XX) XXXXX-XXXX',
            'cpf' => 'Digite um CPF válido',
            'strongPassword' => 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo',
            'fullName' => 'Digite nome e sobrenome completos',
            'adultAge' => 'Você deve ser maior de idade (18 anos)',
            'url' => 'Digite uma URL válida',
            'bloodType' => 'Selecione um tipo sanguíneo válido',
            'positiveNumber' => 'Digite um número positivo',
            'futureDate' => 'A data deve ser futura',
            'timeFormat' => 'Digite um horário válido no formato HH:MM',
            'minLength' => 'Mínimo de {min} caracteres',
            'maxLength' => 'Máximo de {max} caracteres',
            'min' => 'Valor mínimo: {min}',
            'max' => 'Valor máximo: {max}',
            'unique' => 'Este valor já está em uso',
            'exists' => 'Valor não encontrado',
            'match' => 'Os valores não coincidem'
        ];
    }
    
    /**
     * Adiciona regras de validação
     */
    public function addRules($field, $rules) {
        $this->rules[$field] = is_array($rules) ? $rules : [$rules];
        return $this;
    }
    
    /**
     * Define mensagem customizada
     */
    public function setMessage($rule, $message) {
        $this->messages[$rule] = $message;
        return $this;
    }
    
    /**
     * Valida dados
     */
    public function validate($data) {
        $this->errors = [];
        
        foreach ($this->rules as $field => $rules) {
            $value = isset($data[$field]) ? $data[$field] : null;
            $this->validateField($field, $value, $rules);
        }
        
        return empty($this->errors);
    }
    
    /**
     * Valida campo específico
     */
    private function validateField($field, $value, $rules) {
        foreach ($rules as $rule) {
            $error = $this->validateRule($field, $value, $rule);
            if ($error) {
                if (!isset($this->errors[$field])) {
                    $this->errors[$field] = [];
                }
                $this->errors[$field][] = $error;
            }
        }
    }
    
    /**
     * Valida regra específica
     */
    private function validateRule($field, $value, $rule) {
        // Regra obrigatória
        if ($rule === 'required') {
            if (empty($value) && $value !== '0') {
                return $this->messages['required'];
            }
            return null;
        }
        
        // Se valor está vazio e não é obrigatório, não validar outras regras
        if (empty($value) && $value !== '0') {
            return null;
        }
        
        // Regras com parâmetros
        if (is_array($rule)) {
            return $this->validateParameterizedRule($field, $value, $rule);
        }
        
        // Regras simples
        switch ($rule) {
            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    return $this->messages['email'];
                }
                break;
                
            case 'phone':
                if (!preg_match('/^\(\d{2}\)\s\d{4,5}-\d{4}$/', $value)) {
                    return $this->messages['phone'];
                }
                break;
                
            case 'cpf':
                if (!$this->validateCPF($value)) {
                    return $this->messages['cpf'];
                }
                break;
                
            case 'strongPassword':
                if (!$this->validateStrongPassword($value)) {
                    return $this->messages['strongPassword'];
                }
                break;
                
            case 'fullName':
                $parts = explode(' ', trim($value));
                if (count($parts) < 2 || strlen($parts[0]) < 2 || strlen($parts[1]) < 2) {
                    return $this->messages['fullName'];
                }
                break;
                
            case 'adultAge':
                if (!$this->validateAdultAge($value)) {
                    return $this->messages['adultAge'];
                }
                break;
                
            case 'url':
                if (!filter_var($value, FILTER_VALIDATE_URL)) {
                    return $this->messages['url'];
                }
                break;
                
            case 'bloodType':
                $validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                if (!in_array($value, $validTypes)) {
                    return $this->messages['bloodType'];
                }
                break;
                
            case 'positiveNumber':
                if (!is_numeric($value) || floatval($value) <= 0) {
                    return $this->messages['positiveNumber'];
                }
                break;
                
            case 'futureDate':
                $date = strtotime($value);
                if (!$date || $date <= time()) {
                    return $this->messages['futureDate'];
                }
                break;
                
            case 'timeFormat':
                if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $value)) {
                    return $this->messages['timeFormat'];
                }
                break;
        }
        
        return null;
    }
    
    /**
     * Valida regras com parâmetros
     */
    private function validateParameterizedRule($field, $value, $rule) {
        $type = $rule['type'] ?? '';
        
        switch ($type) {
            case 'minLength':
                if (strlen($value) < $rule['min']) {
                    return str_replace('{min}', $rule['min'], $this->messages['minLength']);
                }
                break;
                
            case 'maxLength':
                if (strlen($value) > $rule['max']) {
                    return str_replace('{max}', $rule['max'], $this->messages['maxLength']);
                }
                break;
                
            case 'min':
                if (!is_numeric($value) || floatval($value) < $rule['min']) {
                    return str_replace('{min}', $rule['min'], $this->messages['min']);
                }
                break;
                
            case 'max':
                if (!is_numeric($value) || floatval($value) > $rule['max']) {
                    return str_replace('{max}', $rule['max'], $this->messages['max']);
                }
                break;
                
            case 'pattern':
                if (!preg_match($rule['pattern'], $value)) {
                    return $rule['message'] ?? 'Formato inválido';
                }
                break;
                
            case 'unique':
                if ($this->checkUnique($rule['table'], $rule['column'], $value, $rule['except'] ?? null)) {
                    return $this->messages['unique'];
                }
                break;
                
            case 'exists':
                if (!$this->checkExists($rule['table'], $rule['column'], $value)) {
                    return $this->messages['exists'];
                }
                break;
                
            case 'match':
                $matchField = $rule['field'];
                $matchValue = $_POST[$matchField] ?? $_GET[$matchField] ?? null;
                if ($value !== $matchValue) {
                    return $this->messages['match'];
                }
                break;
        }
        
        return null;
    }
    
    /**
     * Valida CPF
     */
    private function validateCPF($cpf) {
        $cpf = preg_replace('/\D/', '', $cpf);
        
        if (strlen($cpf) != 11) return false;
        
        // Verifica se não são todos iguais
        if (preg_match('/^(\d)\1{10}$/', $cpf)) return false;
        
        // Valida primeiro dígito verificador
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $sum += intval($cpf[$i]) * (10 - $i);
        }
        $remainder = ($sum * 10) % 11;
        if ($remainder == 10 || $remainder == 11) $remainder = 0;
        if ($remainder != intval($cpf[9])) return false;
        
        // Valida segundo dígito verificador
        $sum = 0;
        for ($i = 0; $i < 10; $i++) {
            $sum += intval($cpf[$i]) * (11 - $i);
        }
        $remainder = ($sum * 10) % 11;
        if ($remainder == 10 || $remainder == 11) $remainder = 0;
        if ($remainder != intval($cpf[10])) return false;
        
        return true;
    }
    
    /**
     * Valida senha forte
     */
    private function validateStrongPassword($password) {
        if (strlen($password) < 8) return false;
        if (!preg_match('/[a-z]/', $password)) return false;
        if (!preg_match('/[A-Z]/', $password)) return false;
        if (!preg_match('/\d/', $password)) return false;
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) return false;
        return true;
    }
    
    /**
     * Valida idade adulta
     */
    private function validateAdultAge($birthDate) {
        $birth = new DateTime($birthDate);
        $today = new DateTime();
        $age = $today->diff($birth)->y;
        return $age >= 18;
    }
    
    /**
     * Verifica unicidade no banco
     */
    private function checkUnique($table, $column, $value, $except = null) {
        global $pdo;
        
        if (!$pdo) return false;
        
        $sql = "SELECT COUNT(*) FROM {$table} WHERE {$column} = ?";
        $params = [$value];
        
        if ($except) {
            $sql .= " AND id != ?";
            $params[] = $except;
        }
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Erro na validação unique: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verifica existência no banco
     */
    private function checkExists($table, $column, $value) {
        global $pdo;
        
        if (!$pdo) return false;
        
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE {$column} = ?");
            $stmt->execute([$value]);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Erro na validação exists: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Obtém erros de validação
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * Obtém primeiro erro de um campo
     */
    public function getFirstError($field) {
        return isset($this->errors[$field]) ? $this->errors[$field][0] : null;
    }
    
    /**
     * Verifica se tem erros
     */
    public function hasErrors() {
        return !empty($this->errors);
    }
    
    /**
     * Limpa erros
     */
    public function clearErrors() {
        $this->errors = [];
        return $this;
    }
    
    /**
     * Sanitiza dados de entrada
     */
    public static function sanitize($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitize'], $data);
        }
        
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Configurações pré-definidas
     */
    public static function getPresetRules($type) {
        $presets = [
            'login' => [
                'email' => ['required', 'email'],
                'senha' => ['required', ['type' => 'minLength', 'min' => 6]]
            ],
            
            'cadastro' => [
                'nome' => ['required', 'fullName'],
                'email' => ['required', 'email', ['type' => 'unique', 'table' => 'usuarios', 'column' => 'email']],
                'telefone' => ['required', 'phone'],
                'senha' => ['required', 'strongPassword'],
                'confirmar_senha' => ['required', ['type' => 'match', 'field' => 'senha']]
            ],
            
            'campanha' => [
                'titulo' => ['required', ['type' => 'minLength', 'min' => 5]],
                'descricao' => ['required', ['type' => 'minLength', 'min' => 20]],
                'local' => ['required'],
                'data' => ['required', 'futureDate'],
                'hora' => ['required', 'timeFormat'],
                'tipoSanguineo' => ['required', 'bloodType'],
                'meta' => ['required', 'positiveNumber']
            ],
            
            'perfil' => [
                'nome' => ['required', 'fullName'],
                'email' => ['required', 'email'],
                'telefone' => ['phone'],
                'dataNascimento' => ['adultAge']
            ]
        ];
        
        return $presets[$type] ?? [];
    }
}

// Função helper para validação rápida
function validateData($data, $type) {
    $validator = new ValidationServer();
    $rules = ValidationServer::getPresetRules($type);
    
    foreach ($rules as $field => $fieldRules) {
        $validator->addRules($field, $fieldRules);
    }
    
    $isValid = $validator->validate($data);
    
    return [
        'valid' => $isValid,
        'errors' => $validator->getErrors()
    ];
}

// Endpoint para validação AJAX
if (isset($_SERVER['HTTP_X_VALIDATION_REQUEST'])) {
    header('Content-Type: application/json');
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $_GET['type'] ?? 'generic';
        
        if (!$input) {
            throw new Exception('Dados inválidos');
        }
        
        // Sanitizar dados
        $data = ValidationServer::sanitize($input);
        
        // Validar
        $result = validateData($data, $type);
        
        if ($result['valid']) {
            echo json_encode(['valid' => true, 'message' => 'Dados válidos']);
        } else {
            http_response_code(400);
            echo json_encode([
                'valid' => false,
                'errors' => array_map(function($field, $errors) {
                    return [
                        'field' => $field,
                        'message' => $errors[0] // Primeiro erro
                    ];
                }, array_keys($result['errors']), $result['errors'])
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'valid' => false,
            'errors' => [['field' => 'general', 'message' => $e->getMessage()]]
        ]);
    }
    
    exit;
}

?>
