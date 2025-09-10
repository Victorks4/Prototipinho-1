/**
 * HemoByte - Back-end JavaScript Completo
 * Sistema de gerenciamento de campanhas de doação de sangue
 * Desenvolvido com foco em segurança, responsividade e funcionalidade
 * Mantém compatibilidade com o back-end PHP existente
 */

// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================
const HEMOBYTE_CONFIG = {
    // URLs da API PHP (mantendo o back-end PHP existente)
    API: {
        BASE_URL: window.location.origin,
        LOGIN: '/login.php',
        CADASTRO: '/cadastrar.php',
        PARTICIPANTES: '/api/participantes/cadastrar.php'
    },
    
    // Configurações de segurança
    SECURITY: {
        MAX_LOGIN_ATTEMPTS: 3,
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
        CSRF_TOKEN_LENGTH: 32,
        PASSWORD_MIN_LENGTH: 6
    },
    
    // Configurações de validação
    VALIDATION: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 100
    },
    
    // Configurações de interface
    UI: {
        NOTIFICATION_TIMEOUT: 5000,
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 300
    }
};

// ==========================================
// CLASSE PRINCIPAL DO SISTEMA
// ==========================================
class HemoByteSystem {
    constructor() {
        this.currentUser = null;
        this.loginAttempts = 0;
        this.sessionTimeout = null;
        this.lastActivity = Date.now();
        this.campaigns = [];
        this.filteredCampaigns = [];
        this.currentFilters = {};
        this.csrfToken = null;
        
        this.init();
    }

    /**
     * Inicializa o sistema
     */
    async init() {
        console.log('🚀 Inicializando HemoByte System...');
        
        try {
            // Aguarda o DOM estar carregado
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeSystem());
            } else {
                await this.initializeSystem();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema:', error);
            this.showNotification('Erro ao carregar sistema', 'error');
        }
    }

    /**
     * Inicialização principal do sistema
     */
    async initializeSystem() {
        try {
            // Configura segurança
            this.setupSecurity();
            
            // Configura interface responsiva
            this.setupResponsiveUI();
            
            // Verifica sessão existente
            await this.checkExistingSession();
            
            // Inicializa funcionalidades da página atual
            await this.initializeCurrentPage();
            
            // Configura atualizações automáticas
            this.setupAutoUpdates();
            
            // Configura rastreamento de atividade
            this.setupActivityTracking();
            
            console.log('✅ HemoByte System inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }

    // ==========================================
    // GERENCIAMENTO DE SEGURANÇA
    // ==========================================

    /**
     * Configura medidas de segurança
     */
    setupSecurity() {
        // Sanitização automática de inputs
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.sanitizeInput(e.target);
            }
        });

        // Proteção contra ataques XSS
        this.setupXSSProtection();
        
        // Geração de token CSRF
        this.generateCSRFToken();
        
        console.log('🔒 Medidas de segurança configuradas');
    }

    /**
     * Sanitiza entrada do usuário
     */
    sanitizeInput(input) {
        const value = input.value;
        
        // Remove scripts maliciosos e caracteres perigosos
        const sanitized = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/[<>]/g, '');
        
        if (sanitized !== value) {
            input.value = sanitized;
            console.warn('⚠️ Conteúdo potencialmente perigoso removido');
            this.showNotification('Caracteres não permitidos foram removidos', 'warning');
        }
    }

    /**
     * Configura proteção XSS
     */
    setupXSSProtection() {
        // Adiciona meta tag CSP se não existir
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const cspMeta = document.createElement('meta');
            cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
            cspMeta.setAttribute('content', 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' data: https:;"
            );
            document.head.appendChild(cspMeta);
        }
    }

    /**
     * Gera token CSRF
     */
    generateCSRFToken() {
        const array = new Uint8Array(HEMOBYTE_CONFIG.SECURITY.CSRF_TOKEN_LENGTH);
        crypto.getRandomValues(array);
        this.csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // ==========================================
    // GERENCIAMENTO DE SESSÃO E AUTENTICAÇÃO
    // ==========================================

    /**
     * Verifica sessão existente
     */
    async checkExistingSession() {
        try {
            const userData = localStorage.getItem('usuario');
            const sessionData = localStorage.getItem('session_data');
            
            if (userData) {
                const user = JSON.parse(userData);
                
                // Sempre sincronizar currentUser com localStorage
                this.currentUser = user;
                
                if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Verifica se a sessão não expirou
                if (session.expires > Date.now()) {
                    this.updateNavigationForLoggedUser(user);
                    console.log('✅ Sessão restaurada para:', user.nome);
                } else {
                        // Sessão expirada, mas manter usuário logado
                        this.createSession(user);
                        this.updateNavigationForLoggedUser(user);
                        console.log('🔄 Sessão renovada para:', user.nome);
                    }
                } else {
                    // Tem dados do usuário mas não sessão - criar nova sessão
                    this.createSession(user);
                    this.updateNavigationForLoggedUser(user);
                    console.log('✅ Nova sessão criada para:', user.nome);
                }
            } else {
                // Não há dados de usuário
                this.currentUser = null;
                this.updateNavigationForLoggedOut();
            }
        } catch (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            this.clearSession();
        }
    }

    /**
     * Realiza login com segurança aprimorada
     */
    async fazerLoginSeguro(email, senha) {
        try {
            // Verifica limite de tentativas
            if (this.loginAttempts >= HEMOBYTE_CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
                throw new Error('Muitas tentativas de login. Aguarde alguns minutos.');
            }

            // Valida dados de entrada
            if (!this.validateLoginData(email, senha)) {
                throw new Error('Email ou senha inválidos');
            }

            // Mostra loading com animação
            this.showLoadingWithAnimation('Fazendo login...');

            // Sanitiza dados antes do envio
            const sanitizedEmail = this.sanitizeString(email.trim().toLowerCase());
            const sanitizedSenha = this.sanitizeString(senha);

            // Faz requisição para o PHP existente
            const response = await fetch('login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': this.csrfToken
                },
                body: `email=${encodeURIComponent(sanitizedEmail)}&senha=${encodeURIComponent(sanitizedSenha)}`
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }

            if (data.success) {
                // Login bem-sucedido
                this.currentUser = data.user;
                this.loginAttempts = 0;
                
                // Salva sessão com segurança aprimorada
                this.saveSecureSession(data.user);
                
                // Atualiza interface
                this.updateNavigationForLoggedUser(data.user);
                this.showNotification('Login realizado com sucesso!', 'success');
                
                console.log('✅ Login realizado:', data.user.nome);
                return true;
            } else {
                throw new Error(data.message || 'Credenciais inválidas');
            }

        } catch (error) {
            this.loginAttempts++;
            console.error('❌ Erro no login:', error);
            this.showNotification(error.message, 'error');
            return false;
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Realiza cadastro com validação aprimorada
     */
    async fazerCadastroSeguro(dadosUsuario) {
        try {
            // Valida dados de entrada
            if (!this.validateRegisterData(dadosUsuario)) {
                throw new Error('Dados de cadastro inválidos');
            }

            // Mostra loading
            this.showLoadingWithAnimation('Criando conta...');

            // Sanitiza todos os dados
            const sanitizedData = this.sanitizeUserData(dadosUsuario);

            // Prepara dados para envio
            const formData = new URLSearchParams();
            Object.entries(sanitizedData).forEach(([key, value]) => {
                formData.append(key, value);
            });

            // Faz requisição para o PHP existente
            const response = await fetch('cadastrar.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': this.csrfToken
                },
                body: formData.toString()
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = Array.isArray(data.errors) ? data.errors.join('\n') : data.error || 'Erro ao cadastrar';
                throw new Error(errorMsg);
            }

            if (data.success) {
                // Cadastro bem-sucedido
                this.currentUser = data.user;
                
                // Salva sessão
                this.saveSecureSession(data.user);
                
                // Atualiza interface
                this.updateNavigationForLoggedUser(data.user);
                this.showNotification('Cadastro realizado com sucesso!', 'success');
                
                console.log('✅ Cadastro realizado:', data.user.nome);
                return true;
            } else {
                throw new Error(data.message || 'Erro ao fazer cadastro');
            }

        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            this.showNotification(error.message, 'error');
            return false;
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Salva sessão com segurança aprimorada
     */
    saveSecureSession(userData) {
        try {
            const sessionData = {
                created: Date.now(),
                expires: Date.now() + HEMOBYTE_CONFIG.SECURITY.SESSION_TIMEOUT,
                lastActivity: Date.now(),
                userAgent: navigator.userAgent.substring(0, 100) // Limitado para segurança
            };

            localStorage.setItem('usuario', JSON.stringify(userData));
            localStorage.setItem('session_data', JSON.stringify(sessionData));
            
            this.updateLastActivity();
            console.log('💾 Sessão salva com segurança');
        } catch (error) {
            console.error('❌ Erro ao salvar sessão:', error);
        }
    }

    /**
     * Limpa sessão
     */
    clearSession() {
        this.currentUser = null;
        localStorage.removeItem('usuario');
        localStorage.removeItem('session_data');
        
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
        
        console.log('🗑️ Sessão limpa');
    }

    /**
     * Faz logout seguro
     */
    fazerLogoutSeguro(motivo = 'Logout solicitado pelo usuário') {
        console.log('👋 Fazendo logout:', motivo);
        
        this.clearSession();
        this.updateNavigationForLoggedOut();
        this.showNotification('Logout realizado com sucesso', 'info');
        
        // Redireciona se necessário
        const currentPage = this.getCurrentPage();
        const protectedPages = ['criar-campanha', 'perfil'];
        
        if (protectedPages.includes(currentPage)) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    }

    // ==========================================
    // VALIDAÇÃO E SANITIZAÇÃO
    // ==========================================

    /**
     * Valida dados de login
     */
    validateLoginData(email, senha) {
        if (!email || !senha) {
            this.showNotification('Email e senha são obrigatórios', 'error');
            return false;
        }
        
        if (!HEMOBYTE_CONFIG.VALIDATION.EMAIL_REGEX.test(email)) {
            this.showNotification('Email inválido', 'error');
            return false;
        }
        
        if (senha.length < HEMOBYTE_CONFIG.SECURITY.PASSWORD_MIN_LENGTH) {
            this.showNotification(`Senha deve ter pelo menos ${HEMOBYTE_CONFIG.SECURITY.PASSWORD_MIN_LENGTH} caracteres`, 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Valida dados de cadastro
     */
    validateRegisterData(dados) {
        const { nome, email, telefone, senha, confirmar_senha } = dados;

        if (!nome || nome.length < HEMOBYTE_CONFIG.VALIDATION.NAME_MIN_LENGTH) {
            this.showNotification('Nome deve ter pelo menos 2 caracteres', 'error');
            return false;
        }

        if (!email || !HEMOBYTE_CONFIG.VALIDATION.EMAIL_REGEX.test(email)) {
            this.showNotification('Email inválido', 'error');
            return false;
        }

        if (!telefone) {
            this.showNotification('Telefone é obrigatório', 'error');
            return false;
        }

        if (!senha || senha.length < HEMOBYTE_CONFIG.SECURITY.PASSWORD_MIN_LENGTH) {
            this.showNotification(`Senha deve ter pelo menos ${HEMOBYTE_CONFIG.SECURITY.PASSWORD_MIN_LENGTH} caracteres`, 'error');
            return false;
        }

        if (senha !== confirmar_senha) {
            this.showNotification('As senhas não coincidem', 'error');
            return false;
        }

        return true;
    }

    /**
     * Sanitiza string individual
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        
        return str
            .trim()
            .replace(/[<>]/g, '') // Remove < e >
            .replace(/javascript:/gi, '') // Remove javascript:
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .substring(0, 1000); // Limita tamanho
    }

    /**
     * Sanitiza dados do usuário
     */
    sanitizeUserData(dados) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(dados)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    // ==========================================
    // INTERFACE RESPONSIVA E ANIMAÇÕES
    // ==========================================

    /**
     * Configura interface responsiva
     */
    setupResponsiveUI() {
        // Configura container de notificações
        this.setupNotificationContainer();
        
        // Configura overlay de loading
        this.setupLoadingOverlay();
        
        // Configura handlers de redimensionamento
        this.setupResizeHandlers();
        
        // Configura animações
        this.setupAnimations();
        
        console.log('🎨 Interface responsiva configurada');
    }

    /**
     * Configura container de notificações
     */
    setupNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    /**
     * Configura overlay de loading
     */
    setupLoadingOverlay() {
        if (!document.getElementById('loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(5px);
            `;
            
            overlay.innerHTML = `
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #e60000;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    "></div>
                    <p id="loading-text" style="
                        margin: 0;
                        color: #333;
                        font-weight: 500;
                    ">Carregando...</p>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Adiciona CSS da animação
            if (!document.getElementById('loading-styles')) {
                const style = document.createElement('style');
                style.id = 'loading-styles';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .notification {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        margin-bottom: 10px;
                        padding: 16px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        transform: translateX(100%);
                        transition: all 0.3s ease;
                        pointer-events: auto;
                        max-width: 400px;
                        word-wrap: break-word;
                    }
                    
                    .notification.show {
                        transform: translateX(0);
                    }
                    
                    .notification.hide {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    
                    .notification.success {
                        border-left: 4px solid #28a745;
                        color: #155724;
                    }
                    
                    .notification.error {
                        border-left: 4px solid #dc3545;
                        color: #721c24;
                    }
                    
                    .notification.warning {
                        border-left: 4px solid #ffc107;
                        color: #856404;
                    }
                    
                    .notification.info {
                        border-left: 4px solid #17a2b8;
                        color: #0c5460;
                    }
                    
                    .notification-close {
                        background: none;
                        border: none;
                        font-size: 18px;
                        cursor: pointer;
                        color: #999;
                        margin-left: auto;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .notification-close:hover {
                        color: #666;
                    }
                    
                    @media (max-width: 768px) {
                        #notification-container {
                            top: 10px;
                            right: 10px;
                            left: 10px;
                            max-width: none;
                        }
                        
                        .notification {
                            max-width: none;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    /**
     * Configura handlers de redimensionamento
     */
    setupResizeHandlers() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Detecta orientação em dispositivos móveis
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }

    /**
     * Lida com redimensionamento
     */
    handleResize() {
        // Ajusta layout de grids
        const grids = document.querySelectorAll('.campaigns-grid, .impact-grid, .stories-grid');
        grids.forEach(grid => {
            this.adjustGridLayout(grid);
        });

        // Reposiciona notificações
        this.repositionNotifications();
    }

    /**
     * Lida com mudança de orientação
     */
    handleOrientationChange() {
        // Força recálculo de layouts
        document.body.style.height = '100vh';
        setTimeout(() => {
            document.body.style.height = '';
        }, 500);
    }

    /**
     * Ajusta layout de grids
     */
    adjustGridLayout(grid) {
        const containerWidth = grid.offsetWidth;
        const cardMinWidth = 300;
        const gap = 20;
        
        const columns = Math.floor((containerWidth + gap) / (cardMinWidth + gap));
        grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, 1fr)`;
    }

    /**
     * Configura animações
     */
    setupAnimations() {
        // Intersection Observer para animações de entrada
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observa elementos que devem animar
        const animateElements = document.querySelectorAll(
            '.campaign-card, .impact-card, .story-card, .instruction-card'
        );
        
        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }

    // ==========================================
    // SISTEMA DE NOTIFICAÇÕES
    // ==========================================

    /**
     * Mostra notificação
     */
    showNotification(message, type = 'info', duration = HEMOBYTE_CONFIG.UI.NOTIFICATION_TIMEOUT) {
        const notification = this.createNotification(message, type, duration);
        const container = document.getElementById('notification-container');
        
        container.appendChild(notification);

        // Anima entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove automaticamente
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        return notification;
    }

    /**
     * Cria elemento de notificação
     */
    createNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <span>${icons[type] || icons.info}</span>
            <span style="flex: 1;">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        return notification;
    }

    /**
     * Remove notificação
     */
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    /**
     * Reposiciona notificações
     */
    repositionNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            // Força recálculo de posições
            container.style.transform = 'translateZ(0)';
        }
    }

    // ==========================================
    // SISTEMA DE LOADING
    // ==========================================

    /**
     * Mostra loading com animação
     */
    showLoadingWithAnimation(text = 'Carregando...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Adiciona classe para animação
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }

    /**
     * Esconde loading
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    // ==========================================
    // NAVEGAÇÃO E INTERFACE
    // ==========================================

    /**
     * Atualiza navegação para usuário logado
     */
    updateNavigationForLoggedUser(userData) {
        const navLogin = document.getElementById('nav-login');
        const navProfile = document.getElementById('nav-profile');
        const userName = document.querySelector('.user-name');

        if (navLogin && navProfile) {
            navLogin.style.display = 'none';
            navProfile.style.display = 'block';
            
            if (userName) {
                userName.textContent = userData.nome.split(' ')[0];
            }
        }

        // Adiciona menu dropdown se não existir
        this.setupProfileDropdown(userData);
    }

    /**
     * Atualiza navegação para usuário deslogado
     */
    updateNavigationForLoggedOut() {
        const navLogin = document.getElementById('nav-login');
        const navProfile = document.getElementById('nav-profile');

        if (navLogin && navProfile) {
            navLogin.style.display = 'block';
            navProfile.style.display = 'none';
        }

        // Remove menu dropdown se existir
        const dropdown = document.querySelector('.profile-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
    }

    /**
     * Configura dropdown do perfil
     */
    setupProfileDropdown(userData) {
        const profileLink = document.querySelector('.profile-link');
        if (!profileLink) return;

        // Remove dropdown existente
        const existingDropdown = document.querySelector('.profile-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Cria novo dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'profile-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 8px 0;
            min-width: 200px;
            display: none;
            z-index: 1000;
        `;
        
        dropdown.innerHTML = `
            <div style="padding: 12px 16px; border-bottom: 1px solid #eee;">
                <strong style="display: block; color: #333;">${userData.nome}</strong>
                <small style="color: #666;">${userData.email}</small>
            </div>
            <a href="public/perfil.html" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; text-decoration: none; color: #333; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-user"></i> Meu Perfil
            </a>
            <a href="criar-campanha.html" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; text-decoration: none; color: #333; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-plus-circle"></i> Criar Campanha
            </a>
            <div style="height: 1px; background: #eee; margin: 8px 0;"></div>
            <button id="btn-sair-dropdown" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: none; border: none; color: #e60000; cursor: pointer; width: 100%; text-align: left; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        `;

        profileLink.parentNode.style.position = 'relative';
        profileLink.parentNode.appendChild(dropdown);

        // Configura toggle do dropdown
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Configura logout do dropdown
        const logoutBtn = dropdown.querySelector('#btn-sair-dropdown');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.fazerLogoutSeguro();
                dropdown.style.display = 'none';
            });
        }

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!profileLink.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // ==========================================
    // RASTREAMENTO DE ATIVIDADE
    // ==========================================

    /**
     * Configura rastreamento de atividade
     */
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, { passive: true });
        });

        // Verifica inatividade a cada minuto
        setInterval(() => {
            this.checkSessionTimeout();
        }, 60 * 1000);
    }

    /**
     * Atualiza timestamp da última atividade
     */
    updateLastActivity() {
        this.lastActivity = Date.now();
        
        // Atualiza dados da sessão
        const sessionData = localStorage.getItem('session_data');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                session.lastActivity = Date.now();
                localStorage.setItem('session_data', JSON.stringify(session));
            } catch (error) {
                console.error('❌ Erro ao atualizar atividade:', error);
            }
        }
    }

    /**
     * Verifica se a sessão expirou por inatividade
     */
    checkSessionTimeout() {
        if (!this.currentUser) return;

        const inactiveTime = Date.now() - this.lastActivity;
        if (inactiveTime > HEMOBYTE_CONFIG.SECURITY.SESSION_TIMEOUT) {
            console.log('⏰ Sessão expirada por inatividade');
            this.fazerLogoutSeguro('Sessão expirada por inatividade');
        }
    }

    // ==========================================
    // INICIALIZAÇÃO DE PÁGINAS
    // ==========================================

    /**
     * Inicializa funcionalidades da página atual
     */
    async initializeCurrentPage() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'index':
                await this.initializeHomePage();
                break;
            case 'campanhas-ativas':
                await this.initializeCampaignsPage();
                break;
            case 'criar-campanha':
                await this.initializeCreateCampaignPage();
                break;
            case 'login':
                await this.initializeLoginPage();
                break;
            default:
                console.log(`📄 Página ${currentPage} carregada`);
        }
    }

    /**
     * Obtém a página atual
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    }

    /**
     * Inicializa página inicial
     */
    async initializeHomePage() {
        console.log('🏠 Inicializando página inicial...');
        
        // Anima contadores de estatísticas
        this.animateCounters();
        
        // Configura smooth scroll
        this.setupSmoothScroll();
    }

    /**
     * Inicializa página de campanhas
     */
    async initializeCampaignsPage() {
        console.log('📋 Inicializando página de campanhas...');
        
        // Inicializa sistema de filtros existente
        this.enhanceExistingFilters();
    }

    /**
     * Inicializa página de criar campanha
     */
    async initializeCreateCampaignPage() {
        console.log('➕ Inicializando página de criar campanha...');
        
        // Verifica se usuário está logado (usando localStorage diretamente)
        const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        
        if (!usuario && !this.currentUser) {
            this.showNotification('Faça login para criar campanhas', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Se encontrou usuário no localStorage mas não em currentUser, sincronizar
        if (usuario && !this.currentUser) {
            this.currentUser = usuario;
            console.log('✅ Usuário sincronizado do localStorage:', usuario.nome);
        }
        
        // Melhora formulário existente
        this.enhanceCreateCampaignForm();
    }

    /**
     * Inicializa página de login
     */
    async initializeLoginPage() {
        console.log('🔐 Inicializando página de login...');
        
        // Se já estiver logado, redireciona
        if (this.currentUser) {
            this.showNotification('Você já está logado', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return;
        }
        
        // Melhora formulários de login e cadastro existentes
        this.enhanceAuthForms();
    }

    // ==========================================
    // MELHORIAS DOS SISTEMAS EXISTENTES
    // ==========================================

    /**
     * Melhora formulários de autenticação existentes
     */
    enhanceAuthForms() {
        // Melhora formulário de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            // Remove event listener antigo se existir
            const newLoginForm = loginForm.cloneNode(true);
            loginForm.parentNode.replaceChild(newLoginForm, loginForm);
            
            newLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = newLoginForm.querySelector('input[type="email"]').value;
                const senha = newLoginForm.querySelector('input[type="password"]').value;
                
                const success = await this.fazerLoginSeguro(email, senha);
                if (success) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
        }

        // Melhora formulário de cadastro
        const cadastroForm = document.getElementById('cadastro-form');
        if (cadastroForm) {
            // Remove event listener antigo se existir
            const newCadastroForm = cadastroForm.cloneNode(true);
            cadastroForm.parentNode.replaceChild(newCadastroForm, cadastroForm);
            
            newCadastroForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const dados = {
                    nome: newCadastroForm.querySelector('input[name="nome"]').value,
                    email: newCadastroForm.querySelector('input[name="email"]').value,
                    telefone: newCadastroForm.querySelector('input[name="telefone"]').value,
                    senha: newCadastroForm.querySelector('input[name="senha"]').value,
                    confirmar_senha: newCadastroForm.querySelector('input[name="confirmar_senha"]').value
                };
                
                const success = await this.fazerCadastroSeguro(dados);
                if (success) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
        }

        // Adiciona validação em tempo real
        this.addRealTimeValidation();
    }

    /**
     * Adiciona validação em tempo real aos formulários
     */
    addRealTimeValidation() {
        const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[name="nome"], input[name="telefone"]');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateFieldRealTime(input);
            });
            
            input.addEventListener('blur', () => {
                this.validateFieldRealTime(input);
            });
        });
    }

    /**
     * Valida campo em tempo real
     */
    validateFieldRealTime(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        // Remove classes anteriores
        field.classList.remove('valid', 'invalid');

        if (field.type === 'email' && value) {
            isValid = HEMOBYTE_CONFIG.VALIDATION.EMAIL_REGEX.test(value);
            message = isValid ? '' : 'Email inválido';
        } else if (field.type === 'password' && value) {
            isValid = value.length >= HEMOBYTE_CONFIG.SECURITY.PASSWORD_MIN_LENGTH;
            message = isValid ? '' : `Mínimo ${HEMOBYTE_CONFIG.SECURITY.PASSWORD_MIN_LENGTH} caracteres`;
        } else if (field.name === 'nome' && value) {
            isValid = value.length >= HEMOBYTE_CONFIG.VALIDATION.NAME_MIN_LENGTH;
            message = isValid ? '' : 'Nome muito curto';
        }

        // Aplica classe de validação
        if (value) {
            field.classList.add(isValid ? 'valid' : 'invalid');
        }

        // Mostra/esconde mensagem de erro
        this.showFieldError(field, message);
    }

    /**
     * Mostra erro do campo
     */
    showFieldError(field, message) {
        let errorElement = field.parentNode.querySelector('.field-error');
        
        if (message) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.style.cssText = `
                    color: #dc3545;
                    font-size: 0.8rem;
                    margin-top: 4px;
                    display: block;
                `;
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        } else if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Melhora filtros existentes
     */
    enhanceExistingFilters() {
        // Adiciona loading aos filtros
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.showNotification('Aplicando filtros...', 'info', 1000);
            });
        });

        // Melhora busca
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.showNotification('Buscando...', 'info', 1000);
                }, HEMOBYTE_CONFIG.UI.DEBOUNCE_DELAY);
            });
        }
    }

    /**
     * Melhora formulário de criar campanha
     */
    enhanceCreateCampaignForm() {
        const form = document.querySelector('.campaign-form');
        if (!form) return;

        // Adiciona validação em tempo real
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateFieldRealTime(input);
            });
        });

        // Melhora upload de imagem
        this.enhanceImageUpload(form);
        
        // Adiciona máscaras de input
        this.addInputMasks(form);
    }

    /**
     * Melhora upload de imagem
     */
    enhanceImageUpload(form) {
        const uploadArea = form.querySelector('.upload-area');
        if (!uploadArea) return;

        // Adiciona funcionalidade de drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.style.borderColor = '#e60000';
                uploadArea.style.backgroundColor = '#fff5f5';
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.backgroundColor = 'transparent';
            });
        });
    }

    /**
     * Adiciona máscaras de input
     */
    addInputMasks(form) {
        // Máscara para telefone
        const phoneInputs = form.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                
                if (value.length > 2) {
                    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                }
                if (value.length > 9) {
                    value = `${value.slice(0, 9)}-${value.slice(9)}`;
                }
                
                e.target.value = value;
            });
        });

        // Máscara para data
        const dateInputs = form.querySelectorAll('input[placeholder="dd/mm/aaaa"]');
        dateInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 8) value = value.slice(0, 8);
                
                if (value.length > 2) {
                    value = `${value.slice(0, 2)}/${value.slice(2)}`;
                }
                if (value.length > 5) {
                    value = `${value.slice(0, 5)}/${value.slice(5)}`;
                }
                
                e.target.value = value;
            });
        });

        // Máscara para horário
        const timeInputs = form.querySelectorAll('input[placeholder="--:--"]');
        timeInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 4) value = value.slice(0, 4);
                
                if (value.length > 2) {
                    value = `${value.slice(0, 2)}:${value.slice(2)}`;
                }
                
                e.target.value = value;
            });
        });
    }

    /**
     * Anima contadores
     */
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number, .impact-number');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent.replace(/\D/g, ''));
            if (!target) return;
            
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current < target) {
                    const displayValue = Math.floor(current);
                    counter.textContent = displayValue.toLocaleString() + '+';
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString() + '+';
                }
            };

            // Inicia animação quando elemento fica visível
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });

            observer.observe(counter);
        });
    }

    /**
     * Configura smooth scroll
     */
    setupSmoothScroll() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    // ==========================================
    // ATUALIZAÇÕES AUTOMÁTICAS
    // ==========================================

    /**
     * Configura atualizações automáticas
     */
    setupAutoUpdates() {
        // Verifica sessão a cada minuto
        setInterval(() => {
            if (this.currentUser) {
                this.checkExistingSession();
            }
        }, 60 * 1000);

        // Atualiza estatísticas a cada 5 minutos (apenas na página inicial)
        if (this.getCurrentPage() === 'index') {
            setInterval(() => {
                this.updateStatistics();
            }, 5 * 60 * 1000);
        }
    }

    /**
     * Atualiza estatísticas
     */
    async updateStatistics() {
        try {
            // Simula atualização de estatísticas
            console.log('📊 Atualizando estatísticas...');
            
            // Aqui você pode fazer uma requisição para buscar estatísticas atualizadas
            // Por enquanto, apenas anima os contadores novamente
            this.animateCounters();
            
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    }
}

// ==========================================
// INICIALIZAÇÃO GLOBAL
// ==========================================

// Instância global do sistema
let hemoByteSystem;

// Inicializa o sistema quando o script é carregado
document.addEventListener('DOMContentLoaded', () => {
    hemoByteSystem = new HemoByteSystem();
    
    // Torna disponível globalmente para compatibilidade
    window.hemoByteSystem = hemoByteSystem;
    
    // Mantém compatibilidade com funções antigas
    window.fazerLogin = (email, senha) => hemoByteSystem.fazerLoginSeguro(email, senha);
    window.fazerCadastro = (dados) => hemoByteSystem.fazerCadastroSeguro(dados);
    window.fazerLogout = () => hemoByteSystem.fazerLogoutSeguro();
    window.verificarLogin = () => hemoByteSystem.checkExistingSession();
    window.atualizarNavegacao = () => {
        if (hemoByteSystem.currentUser) {
            hemoByteSystem.updateNavigationForLoggedUser(hemoByteSystem.currentUser);
        } else {
            hemoByteSystem.updateNavigationForLoggedOut();
        }
    };
});

// Exporta para uso em módulos se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HemoByteSystem;
}
