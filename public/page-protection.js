/**
 * SISTEMA DE PROTEÇÃO DE PÁGINAS - HEMOBYTE
 * Controla acesso baseado em autenticação
 */

class PageProtection {
    constructor() {
        this.protectedPages = [
            'criar-campanha.html',
            'public/perfil.html'
        ];
        this.init();
    }

    init() {
        this.checkPageAccess();
        console.log('🛡️ Sistema de proteção inicializado');
    }

    /**
     * Verificar acesso à página atual
     */
    checkPageAccess() {
        const currentPage = this.getCurrentPageName();
        
        if (this.isProtectedPage(currentPage)) {
            if (!this.isUserLoggedIn()) {
                this.redirectToLogin();
                return;
            }
        }

        // Se chegou aqui, tem acesso à página
        this.initializePage();
    }

    /**
     * Obter nome da página atual
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1);
    }

    /**
     * Verificar se página é protegida
     */
    isProtectedPage(pageName) {
        return this.protectedPages.some(page => page.includes(pageName));
    }

    /**
     * Verificar se usuário está logado
     */
    isUserLoggedIn() {
        try {
            const userData = localStorage.getItem('usuario');
            return userData !== null && userData !== 'null';
        } catch (error) {
            return false;
        }
    }

    /**
     * Redirecionar para login
     */
    redirectToLogin() {
        const message = 'Você precisa fazer login para acessar esta página.';
        
        // Mostrar mensagem
        this.showMessage(message, 'warning');
        
        // Redirecionar após delay
        setTimeout(() => {
            const loginPath = this.getCurrentPageName().includes('perfil.html') 
                ? '../login.html' 
                : 'login.html';
            window.location.href = loginPath;
        }, 2000);
    }

    /**
     * Inicializar página específica
     */
    initializePage() {
        const pageName = this.getCurrentPageName();
        
        switch (pageName) {
            case 'criar-campanha.html':
                this.initCreateCampaignPage();
                break;
            case 'perfil.html':
                this.initProfilePage();
                break;
        }
    }

    /**
     * Inicializar página de criar campanha
     */
    initCreateCampaignPage() {
        console.log('📝 Página de criar campanha liberada para usuário logado');
        
        // Remover qualquer mensagem de erro que possa aparecer
        const errorMessages = document.querySelectorAll('.notification, .alert, .warning');
        errorMessages.forEach(msg => {
            if (msg.textContent.includes('login') || msg.textContent.includes('Login')) {
                msg.remove();
            }
        });
    }

    /**
     * Inicializar página de perfil
     */
    initProfilePage() {
        console.log('👤 Página de perfil liberada para usuário logado');
    }

    /**
     * Mostrar mensagem
     */
    showMessage(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `page-protection-message`;
        div.textContent = message;
        
        const colors = {
            warning: '#ffc107',
            error: '#dc3545',
            info: '#007bff'
        };

        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 2rem 3rem;
            border-radius: 12px;
            z-index: 10000;
            font-size: 1.1rem;
            font-weight: 500;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, 2000);
    }
}

// Inicializar proteção
document.addEventListener('DOMContentLoaded', () => {
    new PageProtection();
});

