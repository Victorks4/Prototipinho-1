/**
 * SISTEMA DE AUTENTICAÇÃO LIMPO - HEMOBYTE
 * Arquitetura: Single Responsibility Principle + Clean Code
 * Autor: Sistema Otimizado
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    /**
     * Inicialização do sistema
     */
    init() {
        this.checkUserSession();
        this.updateNavigation();
        this.setupEventListeners();
        console.log('🔐 Sistema de autenticação inicializado');
    }

    /**
     * Verifica sessão do usuário
     */
    checkUserSession() {
        try {
            const userData = localStorage.getItem('usuario');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('✅ Usuário logado:', this.currentUser.nome);
            } else {
                this.currentUser = null;
                console.log('❌ Nenhum usuário logado');
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            this.currentUser = null;
            localStorage.removeItem('usuario');
        }
    }

    /**
     * Atualiza navegação baseada no estado do usuário
     */
    updateNavigation() {
        const navLogin = document.getElementById('nav-login');
        const navProfile = document.getElementById('nav-profile');
        const navLogout = document.getElementById('nav-logout');
        const userName = document.querySelector('.user-name');

        if (this.currentUser) {
            // USUÁRIO LOGADO - Mostrar perfil e logout, esconder login
            if (navLogin) navLogin.style.display = 'none';
            if (navProfile) navProfile.style.display = 'flex';
            if (navLogout) navLogout.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.nome.split(' ')[0];
        } else {
            // USUÁRIO NÃO LOGADO - Mostrar login, esconder perfil e logout
            if (navLogin) navLogin.style.display = 'flex';
            if (navProfile) navProfile.style.display = 'none';
            if (navLogout) navLogout.style.display = 'none';
        }
    }

    /**
     * Configura eventos
     */
    setupEventListeners() {
        // Botão de logout
        const logoutBtns = document.querySelectorAll('#btn-sair, .btn-logout, [data-action="logout"]');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Escutar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'usuario') {
                this.checkUserSession();
                this.updateNavigation();
            }
        });
    }

    /**
     * Função global para atualizar navegação
     */
    static updateGlobalNavigation() {
        const authSystem = window.authSystem || new AuthSystem();
        authSystem.checkUserSession();
        authSystem.updateNavigation();
    }

    /**
     * Fazer logout
     */
    logout() {
        localStorage.removeItem('usuario');
        this.currentUser = null;
        this.updateNavigation();
        
        alert('Logout realizado com sucesso!');
        window.location.href = this.getHomePath();
    }

    /**
     * Verificar se usuário está logado
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Obter usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Caminho para home (relativo à página atual)
     */
    getHomePath() {
        const currentPath = window.location.pathname;
        return currentPath.includes('/public/') ? '../index.html' : 'index.html';
    }

    /**
     * Caminho para perfil (relativo à página atual)
     */
    getProfilePath() {
        const currentPath = window.location.pathname;
        return currentPath.includes('/public/') ? 'perfil.html' : 'public/perfil.html';
    }
}

// Instância global
window.authSystem = new AuthSystem();

// Funções globais para compatibilidade
window.isLoggedIn = () => window.authSystem.isLoggedIn();
window.getCurrentUser = () => window.authSystem.getCurrentUser();
window.updateNavigation = () => window.authSystem.updateNavigation();
