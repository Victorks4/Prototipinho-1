/**
 * Sistema Unificado de Tratamento de Erros - HemoByte
 * Padroniza o tratamento de erros em todo o sistema
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.debugMode = false;
        
        // Configurar captura global de erros
        this.setupGlobalErrorHandling();
        
        console.log('🚨 ErrorHandler inicializado');
    }
    
    /**
     * Configura captura global de erros
     */
    setupGlobalErrorHandling() {
        // Capturar erros JavaScript não tratados
        window.addEventListener('error', (event) => {
            this.handle({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            }, 'global');
        });
        
        // Capturar promises rejeitadas não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handle({
                type: 'unhandled_promise_rejection',
                reason: event.reason,
                promise: event.promise
            }, 'global');
        });
    }
    
    /**
     * Método principal para tratar erros
     */
    handle(error, context = 'unknown', options = {}) {
        const errorInfo = this.processError(error, context, options);
        
        // Log do erro
        this.logError(errorInfo);
        
        // Mostrar notificação se necessário
        if (options.showNotification !== false) {
            this.showErrorNotification(errorInfo, options);
        }
        
        // Enviar telemetria se configurado
        if (options.sendTelemetry !== false) {
            this.sendTelemetry(errorInfo);
        }
        
        // Debug se ativado
        if (this.debugMode || options.debug) {
            console.group(`🚨 Erro em ${context}`);
            console.error('Erro original:', error);
            console.log('Informações processadas:', errorInfo);
            console.trace('Stack trace');
            console.groupEnd();
        }
        
        return errorInfo;
    }
    
    /**
     * Processa informações do erro
     */
    processError(error, context, options) {
        const timestamp = new Date().toISOString();
        const errorId = this.generateErrorId();
        
        let errorInfo = {
            id: errorId,
            timestamp,
            context,
            severity: options.severity || this.determineSeverity(error, context),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getCurrentUserId()
        };
        
        // Processar diferentes tipos de erro
        if (error instanceof Error) {
            errorInfo = {
                ...errorInfo,
                type: 'Error',
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        } else if (typeof error === 'string') {
            errorInfo = {
                ...errorInfo,
                type: 'String',
                message: error
            };
        } else if (error && typeof error === 'object') {
            errorInfo = {
                ...errorInfo,
                type: 'Object',
                ...error
            };
        } else {
            errorInfo = {
                ...errorInfo,
                type: 'Unknown',
                message: String(error)
            };
        }
        
        return errorInfo;
    }
    
    /**
     * Determina a severidade do erro
     */
    determineSeverity(error, context) {
        // Erros críticos
        if (context === 'login' || context === 'payment' || context === 'security') {
            return 'critical';
        }
        
        // Erros de rede
        if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
            return 'high';
        }
        
        // Erros de validação
        if (context === 'validation' || error?.message?.includes('validation')) {
            return 'medium';
        }
        
        // Erros de UI
        if (context === 'ui' || context === 'interface') {
            return 'low';
        }
        
        return 'medium';
    }
    
    /**
     * Gera ID único para o erro
     */
    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Obtém ID do usuário atual
     */
    getCurrentUserId() {
        try {
            const user = window.hemoByteStore?.get('user') || 
                        JSON.parse(localStorage.getItem('usuario') || '{}');
            return user.id || user.email || 'anonymous';
        } catch {
            return 'anonymous';
        }
    }
    
    /**
     * Registra erro no log
     */
    logError(errorInfo) {
        // Adicionar ao log interno
        this.errorLog.unshift(errorInfo);
        
        // Manter tamanho máximo do log
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
        
        // Salvar no localStorage para persistência
        try {
            const savedErrors = JSON.parse(localStorage.getItem('hemobyte_error_log') || '[]');
            savedErrors.unshift(errorInfo);
            localStorage.setItem('hemobyte_error_log', JSON.stringify(savedErrors.slice(0, 50)));
        } catch (e) {
            console.warn('Não foi possível salvar erro no localStorage:', e);
        }
        
        // Log no console baseado na severidade
        const logMethod = this.getLogMethod(errorInfo.severity);
        logMethod(`[${errorInfo.severity.toUpperCase()}] ${errorInfo.context}: ${errorInfo.message}`);
    }
    
    /**
     * Obtém método de log baseado na severidade
     */
    getLogMethod(severity) {
        switch (severity) {
            case 'critical':
                return console.error;
            case 'high':
                return console.error;
            case 'medium':
                return console.warn;
            case 'low':
                return console.info;
            default:
                return console.log;
        }
    }
    
    /**
     * Mostra notificação de erro para o usuário
     */
    showErrorNotification(errorInfo, options) {
        const userMessage = this.getUserFriendlyMessage(errorInfo, options);
        
        // Usar sistema de notificações do HemoByte se disponível
        if (window.hemoByteSystem?.showNotification) {
            const notificationType = errorInfo.severity === 'critical' || errorInfo.severity === 'high' 
                ? 'error' : 'warning';
            
            window.hemoByteSystem.showNotification(userMessage, notificationType);
        } 
        // Usar sistema de notificações do admin se disponível
        else if (window.adminPanel?.showNotification) {
            window.adminPanel.showNotification(userMessage, 'error');
        }
        // Fallback para alert apenas em casos críticos
        else if (errorInfo.severity === 'critical' && !options.silent) {
            alert(`Erro: ${userMessage}`);
        }
    }
    
    /**
     * Gera mensagem amigável para o usuário
     */
    getUserFriendlyMessage(errorInfo, options) {
        // Mensagem personalizada
        if (options.userMessage) {
            return options.userMessage;
        }
        
        // Mensagens baseadas no contexto
        const contextMessages = {
            'login': 'Erro ao fazer login. Verifique suas credenciais e tente novamente.',
            'cadastro': 'Erro ao realizar cadastro. Verifique os dados e tente novamente.',
            'campanha': 'Erro ao processar campanha. Tente novamente em alguns instantes.',
            'upload': 'Erro ao fazer upload do arquivo. Verifique o formato e tamanho.',
            'network': 'Erro de conexão. Verifique sua internet e tente novamente.',
            'validation': 'Dados inválidos. Verifique as informações preenchidas.',
            'permission': 'Você não tem permissão para realizar esta ação.',
            'server': 'Erro no servidor. Nossa equipe foi notificada.',
            'global': 'Ocorreu um erro inesperado. Recarregue a página se o problema persistir.'
        };
        
        return contextMessages[errorInfo.context] || 
               contextMessages['global'] || 
               'Ocorreu um erro. Tente novamente.';
    }
    
    /**
     * Envia telemetria do erro (placeholder)
     */
    sendTelemetry(errorInfo) {
        // Em produção, enviar para serviço de monitoramento
        if (this.debugMode) {
            console.log('📊 Telemetria do erro:', {
                id: errorInfo.id,
                context: errorInfo.context,
                severity: errorInfo.severity,
                message: errorInfo.message,
                timestamp: errorInfo.timestamp
            });
        }
    }
    
    /**
     * Métodos de conveniência para diferentes tipos de erro
     */
    
    // Erro de rede
    network(error, options = {}) {
        return this.handle(error, 'network', {
            severity: 'high',
            userMessage: 'Problema de conexão. Verifique sua internet.',
            ...options
        });
    }
    
    // Erro de validação
    validation(error, options = {}) {
        return this.handle(error, 'validation', {
            severity: 'medium',
            userMessage: 'Dados inválidos. Verifique as informações.',
            ...options
        });
    }
    
    // Erro de permissão
    permission(error, options = {}) {
        return this.handle(error, 'permission', {
            severity: 'high',
            userMessage: 'Você não tem permissão para esta ação.',
            ...options
        });
    }
    
    // Erro crítico
    critical(error, options = {}) {
        return this.handle(error, 'critical', {
            severity: 'critical',
            userMessage: 'Erro crítico. Nossa equipe foi notificada.',
            ...options
        });
    }
    
    // Erro de UI
    ui(error, options = {}) {
        return this.handle(error, 'ui', {
            severity: 'low',
            showNotification: false,
            ...options
        });
    }
    
    /**
     * Utilitários
     */
    
    // Obter log de erros
    getErrorLog() {
        return [...this.errorLog];
    }
    
    // Limpar log de erros
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('hemobyte_error_log');
        console.log('🗑️ Log de erros limpo');
    }
    
    // Ativar/desativar modo debug
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 Modo debug ${enabled ? 'ativado' : 'desativado'}`);
    }
    
    // Obter estatísticas de erros
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            bySeverity: {},
            byContext: {},
            recent: this.errorLog.slice(0, 10)
        };
        
        this.errorLog.forEach(error => {
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
        });
        
        return stats;
    }
    
    // Exportar log para análise
    exportErrorLog() {
        const data = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            errors: this.errorLog
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `hemobyte-errors-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📥 Log de erros exportado');
    }
}

// Instância global
window.errorHandler = new ErrorHandler();

// Disponibilizar métodos globalmente para compatibilidade
window.handleError = (error, context, options) => window.errorHandler.handle(error, context, options);

console.log('🚨 Sistema de tratamento de erros carregado!');
