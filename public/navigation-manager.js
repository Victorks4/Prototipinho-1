/**
 * HemoByte - Gerenciador de Navegação
 * Cuida de mostrar/esconder ícones baseado no login
 */

class NavigationManager {
    constructor() {
        this.navLogin = document.getElementById('nav-login');
        this.navProfile = document.getElementById('nav-profile');
        this.navLogout = document.getElementById('nav-logout');
        this.userNameElement = document.querySelector('.user-name');
        this.profileLinkElement = document.querySelector('.profile-link');
        this.init();
    }

    init() {
        this.updateNavigation();
        this.setupEventListeners();
    }

    updateNavigation() {
        const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        this.forceReflow();

        if (usuario && usuario.isLoggedIn) {
            // Usuário logado - mostra perfil e logout
            if (this.navLogin) this.navLogin.style.display = 'none';
            if (this.navProfile) {
                this.navProfile.style.display = 'flex';
                if (this.userNameElement) this.userNameElement.textContent = usuario.nome.split(' ')[0];
                if (this.profileLinkElement) this.profileLinkElement.href = this.getProfilePath();
            }
            if (this.navLogout) this.navLogout.style.display = 'flex';
        } else {
            // Usuário não logado - mostra apenas login
            if (this.navLogin) this.navLogin.style.display = 'flex';
            if (this.navProfile) this.navProfile.style.display = 'none';
            if (this.navLogout) this.navLogout.style.display = 'none';
        }
    }

    getProfilePath() {
        const currentPage = window.location.pathname;
        if (currentPage.includes('/public/')) {
            return 'perfil.html';
        }
        return 'public/perfil.html';
    }

    setupEventListeners() {
        // Escuta mudanças no localStorage (mudança de aba)
        window.addEventListener('storage', (e) => {
            if (e.key === 'usuario') {
                this.updateNavigation();
            }
        });

        // Escuta eventos de logout
        document.addEventListener('hemobyte:logout', () => {
            this.updateNavigation();
        });
    }

    // Força um reflow para garantir que as transições CSS sejam aplicadas
    forceReflow() {
        void this.navLogin.offsetWidth; 
        void this.navProfile.offsetWidth;
        void this.navLogout.offsetWidth;
    }
}

// Função global para atualizar navegação
window.updateNavigation = function() {
    if (window.navigationManager) {
        window.navigationManager.updateNavigation();
    }
};

// Inicializa quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
    
    // Atualiza navegação quando há mudanças no localStorage
    window.addEventListener('storage', () => {
        setTimeout(() => {
            if (window.navigationManager) {
                window.navigationManager.updateNavigation();
            }
        }, 100);
    });
    
    // Atualiza navegação periodicamente para garantir sincronização
    setInterval(() => {
        if (window.navigationManager) {
            window.navigationManager.updateNavigation();
        }
    }, 2000);
});