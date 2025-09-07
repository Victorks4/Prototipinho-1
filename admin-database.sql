-- ==========================================
-- BANCO DE DADOS ADMINISTRATIVO - HEMOBYTE
-- ==========================================

-- Criar banco se não existir
CREATE DATABASE IF NOT EXISTS hemobyte CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hemobyte;

-- ==========================================
-- TABELA DE CAMPANHAS (ATUALIZADA)
-- ==========================================

-- Atualizar tabela de campanhas existente
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS rejected_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS meta_doadores INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS doadores_atuais INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS descricao TEXT NULL,
ADD COLUMN IF NOT EXISTS imagem_url VARCHAR(255) NULL;

-- ==========================================
-- TABELA DE LOGS ADMINISTRATIVOS
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    admin_user VARCHAR(50) DEFAULT 'adm',
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action),
    INDEX idx_admin_user (admin_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA DE CONFIGURAÇÕES DO SITE
-- ==========================================

CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(50) DEFAULT 'adm',
    
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA DE IMAGENS
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text VARCHAR(255),
    description TEXT,
    category ENUM('campaign', 'general', 'banner', 'logo') DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by VARCHAR(50) DEFAULT 'adm',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA DE SESSÕES ADMINISTRATIVAS
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL UNIQUE,
    admin_user VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_session_id (session_id),
    INDEX idx_admin_user (admin_user),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA DE BACKUP E AUDITORIA
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_type ENUM('full', 'campaigns', 'users', 'images', 'settings') DEFAULT 'full',
    file_path VARCHAR(500),
    file_size BIGINT,
    backup_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'adm',
    status ENUM('completed', 'failed', 'in_progress') DEFAULT 'completed',
    notes TEXT,
    
    INDEX idx_backup_date (backup_date),
    INDEX idx_backup_type (backup_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- INSERIR CONFIGURAÇÕES PADRÃO
-- ==========================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('site_title', 'HemoByte - Doação de Sangue', 'string', 'Título principal do site'),
('site_description', 'Plataforma para campanhas de doação de sangue em Feira de Santana', 'string', 'Descrição do site'),
('maintenance_mode', 'false', 'boolean', 'Modo de manutenção ativo/inativo'),
('emergency_alert', 'true', 'boolean', 'Exibir alerta de emergência'),
('emergency_message', 'Urgente: Precisamos de doadores tipo O-', 'string', 'Mensagem do alerta de emergência'),
('total_donations', '1547', 'number', 'Total de doações realizadas'),
('active_campaigns', '12', 'number', 'Número de campanhas ativas'),
('lives_impacted', '6000', 'number', 'Vidas impactadas pelo projeto'),
('contact_whatsapp', '75981829675', 'string', 'Número do WhatsApp para contato'),
('admin_email', 'admin@hemobyte.com', 'string', 'Email do administrador'),
('backup_frequency', '7', 'number', 'Frequência de backup em dias'),
('max_file_size', '5242880', 'number', 'Tamanho máximo de arquivo em bytes (5MB)')
ON DUPLICATE KEY UPDATE 
setting_value = VALUES(setting_value),
updated_at = CURRENT_TIMESTAMP;

-- ==========================================
-- INSERIR DADOS DE EXEMPLO PARA CAMPANHAS
-- ==========================================

INSERT INTO campanhas (titulo, local, data_campanha, horario, tipo_sanguineo, status, meta_doadores, doadores_atuais, descricao) VALUES
('Campanha de Doação - Feira VI', 'Feira VI, Feira de Santana', '2024-05-15', '08:00 - 17:00', 'A+', 'pendente', 50, 30, 'Campanha urgente para atender demanda do Hospital Geral'),
('Doação Emergencial - Centro', 'Centro, Feira de Santana', '2024-05-16', '09:00 - 16:00', 'O-', 'aprovada', 30, 12, 'Emergência médica requer doadores tipo O- urgentemente'),
('Doe Vida - Tomba', 'Tomba, Feira de Santana', '2024-05-20', '09:00 - 16:00', 'B+', 'aprovada', 40, 25, 'Campanha comunitária no bairro Tomba'),
('Campanha Universitária - UEFS', 'UEFS, Feira de Santana', '2024-05-22', '08:00 - 17:00', 'AB+', 'pendente', 35, 18, 'Campanha realizada na Universidade Estadual de Feira de Santana')
ON DUPLICATE KEY UPDATE 
titulo = VALUES(titulo),
status = VALUES(status);

-- ==========================================
-- INSERIR LOG INICIAL
-- ==========================================

INSERT INTO admin_logs (action, details, admin_user, ip_address) VALUES
('SYSTEM_SETUP', 'Database tables created and initial data inserted', 'system', '127.0.0.1'),
('ADMIN_CREATED', 'Administrative user created with username: adm', 'system', '127.0.0.1');

-- ==========================================
-- CRIAR VIEWS PARA RELATÓRIOS
-- ==========================================

-- View para estatísticas gerais
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM campanhas WHERE status = 'aprovada') as campanhas_aprovadas,
    (SELECT COUNT(*) FROM campanhas WHERE status = 'pendente') as campanhas_pendentes,
    (SELECT COUNT(*) FROM campanhas WHERE status = 'rejeitada') as campanhas_rejeitadas,
    (SELECT COUNT(*) FROM usuarios WHERE status = 'ativo') as usuarios_ativos,
    (SELECT COUNT(*) FROM usuarios WHERE status = 'bloqueado') as usuarios_bloqueados,
    (SELECT SUM(doadores_atuais) FROM campanhas WHERE status = 'aprovada') as total_doacoes,
    (SELECT COUNT(*) FROM admin_images WHERE is_active = TRUE) as imagens_ativas,
    (SELECT COUNT(*) FROM admin_logs WHERE DATE(timestamp) = CURDATE()) as logs_hoje;

-- View para campanhas com detalhes
CREATE OR REPLACE VIEW campanhas_detalhadas AS
SELECT 
    c.*,
    CASE 
        WHEN c.doadores_atuais >= c.meta_doadores THEN 'Completa'
        WHEN c.doadores_atuais >= (c.meta_doadores * 0.8) THEN 'Quase Completa'
        WHEN c.doadores_atuais >= (c.meta_doadores * 0.5) THEN 'Em Andamento'
        ELSE 'Início'
    END as progresso_status,
    ROUND((c.doadores_atuais / c.meta_doadores) * 100, 2) as percentual_completo,
    DATEDIFF(c.data_campanha, CURDATE()) as dias_restantes
FROM campanhas c;

-- ==========================================
-- TRIGGERS PARA AUDITORIA
-- ==========================================

DELIMITER //

-- Trigger para log de alterações em campanhas
CREATE TRIGGER IF NOT EXISTS campanhas_audit_update
AFTER UPDATE ON campanhas
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO admin_logs (action, details, admin_user, ip_address) 
        VALUES (
            'CAMPAIGN_STATUS_CHANGED', 
            CONCAT('Campaign ID: ', NEW.id, ', Status: ', OLD.status, ' -> ', NEW.status),
            'system',
            '127.0.0.1'
        );
    END IF;
END//

-- Trigger para log de novos usuários
CREATE TRIGGER IF NOT EXISTS usuarios_audit_insert
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO admin_logs (action, details, admin_user, ip_address) 
    VALUES (
        'USER_REGISTERED', 
        CONCAT('New user registered: ', NEW.email),
        'system',
        '127.0.0.1'
    );
END//

DELIMITER ;

-- ==========================================
-- PROCEDIMENTOS ARMAZENADOS
-- ==========================================

DELIMITER //

-- Procedimento para limpeza de logs antigos
CREATE PROCEDURE IF NOT EXISTS CleanOldLogs(IN days_to_keep INT)
BEGIN
    DELETE FROM admin_logs 
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    INSERT INTO admin_logs (action, details, admin_user) 
    VALUES ('LOG_CLEANUP', CONCAT('Removed logs older than ', days_to_keep, ' days'), 'system');
END//

-- Procedimento para backup automático
CREATE PROCEDURE IF NOT EXISTS CreateBackupRecord(
    IN backup_name VARCHAR(255),
    IN backup_type VARCHAR(50),
    IN file_path VARCHAR(500),
    IN file_size BIGINT
)
BEGIN
    INSERT INTO admin_backups (backup_name, backup_type, file_path, file_size, created_by) 
    VALUES (backup_name, backup_type, file_path, file_size, 'system');
    
    INSERT INTO admin_logs (action, details, admin_user) 
    VALUES ('BACKUP_CREATED', CONCAT('Backup created: ', backup_name), 'system');
END//

-- Procedimento para estatísticas do dashboard
CREATE PROCEDURE IF NOT EXISTS GetDashboardStats()
BEGIN
    SELECT * FROM admin_stats;
    
    SELECT 
        DATE(timestamp) as data,
        COUNT(*) as total_actions
    FROM admin_logs 
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(timestamp)
    ORDER BY data DESC;
    
    SELECT 
        status,
        COUNT(*) as total
    FROM campanhas 
    GROUP BY status;
END//

DELIMITER ;

-- ==========================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ==========================================

-- Índices para melhor performance em consultas administrativas
CREATE INDEX IF NOT EXISTS idx_campanhas_status_data ON campanhas(status, data_campanha);
CREATE INDEX IF NOT EXISTS idx_usuarios_status_created ON usuarios(status, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_action_timestamp ON admin_logs(action, timestamp);

-- ==========================================
-- COMENTÁRIOS FINAIS
-- ==========================================

-- Este script cria toda a estrutura necessária para o painel administrativo
-- Inclui tabelas, views, triggers, procedimentos e dados iniciais
-- Para executar: mysql -u root -p < admin-database.sql

SELECT 'Database setup completed successfully!' as status;
