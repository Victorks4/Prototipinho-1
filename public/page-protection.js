/**
 * HemoByte - Guardião das Páginas
 * Cuida de quem pode acessar o quê e quando
 */

class PageProtection {
    constructor() {
        this.protectedPages = [
            'public/perfil.html'
        ];
        
        // Páginas que você pode ver, mas não mexer sem login
        this.formValidationPages = [
            'criar-campanha.html'
        ];
        this.init();
    }

    init() {
        this.checkPageAccess();
    }

    checkPageAccess() {
        const currentPage = this.getCurrentPageName();
        
        // Páginas que precisam de login total
        if (this.isProtectedPage(currentPage)) {
            if (!this.isUserLoggedIn()) {
                this.redirectToLogin();
                return;
            }
        }
        
        // Páginas que você pode ver, mas não usar sem login
        if (this.isFormValidationPage(currentPage)) {
            this.initializeFormValidationPage();
            return;
        }

        // Se chegou aqui, está tudo liberado
        this.initializePage();
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1);
    }

    isProtectedPage(pageName) {
        return this.protectedPages.some(page => page.includes(pageName));
    }

    isFormValidationPage(pageName) {
        return this.formValidationPages.some(page => page.includes(pageName));
    }

    initializeFormValidationPage() {
        const pageName = this.getCurrentPageName();
        
        // Configura validação específica para cada tipo de página
        switch (pageName) {
            case 'criar-campanha.html':
                this.setupCampaignCreationValidation();
                break;
        }
    }

    isUserLoggedIn() {
        try {
            const userData = localStorage.getItem('usuario');
            return userData !== null && userData !== 'null';
        } catch (error) {
            return false;
        }
    }

    redirectToLogin() {
        // Só mostra modal se não estiver logado
        if (!this.isUserLoggedIn()) {
            // Usa modal profissional se o sistema de participação estiver disponível
            if (window.campaignParticipationManager) {
                this.showProfessionalPageProtectionModal();
            } else {
                this.showMessage('Você precisa fazer login para acessar esta página.', 'warning');
            }
            
            // Redireciona após 1 minuto
            setTimeout(() => {
                const loginPath = this.getCurrentPageName().includes('perfil.html') 
                    ? '../login.html' 
                    : 'login.html';
                window.location.href = loginPath;
            }, 60000);
        } else {
            // Se está logado, inicializa a página normalmente
            this.initializePage();
        }
    }

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

    initCreateCampaignPage() {
        // Remove qualquer mensagem de erro que possa aparecer
        const errorMessages = document.querySelectorAll('.notification, .alert, .warning');
        errorMessages.forEach(msg => {
            if (msg.textContent.includes('login') || msg.textContent.includes('Login')) {
                msg.remove();
            }
        });
        
        // Adiciona validação para formulário de criação de campanha
        this.setupCampaignCreationValidation();
    }

    setupCampaignCreationValidation() {
        // Aguarda o formulário aparecer na página
        const checkForm = () => {
            const form = document.querySelector('form');
            const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
            
            if (form && submitButton) {
                // Intercepta o envio do formulário
                form.addEventListener('submit', (e) => {
                    if (!this.isUserLoggedIn()) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Mostra modal de login
                        this.showProfessionalPageProtectionModal();
                        
                        // Foca no modal
                        setTimeout(() => {
                            const modal = document.querySelector('.professional-modal');
                            if (modal) {
                                modal.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 100);
                        
                        return false;
                    }
                    
                    return true;
                });
                
                // Também intercepta cliques no botão de submit
                submitButton.addEventListener('click', (e) => {
                    if (!this.isUserLoggedIn()) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Mostra modal de login
                        this.showProfessionalPageProtectionModal();
                        
                        return false;
                    }
                });
            } else {
                // Se o formulário ainda não existe, tenta novamente em 500ms
                setTimeout(checkForm, 500);
            }
        };
        
        checkForm();
    }

    initProfilePage() {
        // Remove qualquer mensagem de erro que possa aparecer
        const errorMessages = document.querySelectorAll('.notification, .alert, .warning');
        errorMessages.forEach(msg => {
            if (msg.textContent.includes('login') || msg.textContent.includes('Login')) {
                msg.remove();
            }
        });
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        const colors = {
            warning: '#ffc107',
            error: '#dc3545',
            success: '#28a745',
            info: '#17a2b8'
        };

        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showProfessionalPageProtectionModal() {
        // Remove modal existente se houver
        const existingModal = document.querySelector('.professional-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'professional-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Poppins', sans-serif;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            transform: translateY(30px);
            transition: transform 0.3s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        const pageName = this.getCurrentPageName();
        modalContent.innerHTML = `
            <div style="background: linear-gradient(135deg, #e60000, #cc0000); color: white; padding: 2rem; border-radius: 20px 20px 0 0; text-align: center; position: relative;">
                <button style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.2rem;" onclick="this.closest('.professional-modal').remove();">
                    <i class="fas fa-times"></i>
                </button>
                <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem; animation: pulse 2s infinite;">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h2 style="margin: 0 0 0.5rem; font-size: 2rem; font-weight: 700;">Acesso Restrito</h2>
                <p style="margin: 0; opacity: 0.9; font-size: 1.2rem;">${pageName} requer autenticação</p>
            </div>
            <div style="padding: 2.5rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h3 style="color: #333; margin-bottom: 1rem; font-size: 1.4rem;">
                        <i class="fas fa-lock" style="color: #e60000; margin-right: 0.5rem;"></i>
                        Área Protegida
                    </h3>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem; font-size: 1.1rem;">
                        Esta página é exclusiva para usuários cadastrados. Faça login 
                        para acessar todas as funcionalidades do HemoByte.
                    </p>
                </div>
                <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
                    <a href="login.html" style="display: inline-flex; align-items: center; gap: 0.8rem; background: linear-gradient(135deg, #e60000, #cc0000); color: white; padding: 1.2rem 2.5rem; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 1.1rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(230, 0, 0, 0.3);">
                        <i class="fas fa-sign-in-alt" style="font-size: 1.2rem;"></i>
                        Fazer Login
                    </a>
                </div>
                <div style="text-align: center; padding-top: 1.5rem; border-top: 2px solid #eee;">
                    <p style="margin: 0; color: #999; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <i class="fas fa-shield-alt"></i>
                        Sua segurança e privacidade são nossas prioridades
                    </p>
                    <p style="margin: 0.5rem 0 0; color: #ccc; font-size: 0.85rem;">
                        Redirecionamento automático em <span id="countdown-timer" style="color: #e60000; font-weight: bold;">60</span> segundos...
                    </p>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Animações
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'translateY(0)';
        }, 10);

        // Inicia contador regressivo
        this.startCountdown(60);

        // Fecha modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Fecha modal com ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    startCountdown(seconds) {
        const timerElement = document.getElementById('countdown-timer');
        if (!timerElement) return;

        let timeLeft = seconds;
        
        const updateTimer = () => {
            timerElement.textContent = timeLeft;
            timeLeft--;
            
            if (timeLeft < 0) {
                // Redirecionar para login
                const loginPath = this.getCurrentPageName().includes('perfil.html') 
                    ? '../login.html' 
                    : 'login.html';
                window.location.href = loginPath;
            } else {
                setTimeout(updateTimer, 1000);
            }
        };
        
        updateTimer();
    }
}

// Função global para validar acesso a páginas protegidas
window.validatePageAccess = function(pageUrl) {
    if (!window.pageProtection) {
        return true;
    }
    
    // Verifica se é uma página protegida
    if (window.pageProtection.isProtectedPage(pageUrl) || window.pageProtection.isFormValidationPage(pageUrl)) {
        if (!window.pageProtection.isUserLoggedIn()) {
            // Mostra modal de proteção
            window.pageProtection.showProfessionalPageProtectionModal();
            
            // Redireciona após 60 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 60000);
            
            return false; // Impede navegação
        }
    }
    
    return true; // Permite navegação
};

// Inicializar sistema de proteção
document.addEventListener('DOMContentLoaded', () => {
    window.pageProtection = new PageProtection();
    
    // Interceptar cliques em links de navegação
    setupNavigationValidation();
});

/**
 * Configurar validação de navegação
 */
function setupNavigationValidation() {
    // Aguarda um pouco para garantir que todos os elementos estão carregados
    setTimeout(() => {
        // Intercepta cliques em links que apontam para páginas protegidas
        const protectedLinks = document.querySelectorAll('a[href*="criar-campanha"], a[href*="perfil"]');
        
        protectedLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Verifica se é uma página protegida
                if (window.pageProtection.isProtectedPage(href) || window.pageProtection.isFormValidationPage(href)) {
                    if (!window.pageProtection.isUserLoggedIn()) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Mostra modal de proteção
                        window.pageProtection.showProfessionalPageProtectionModal();
                        
                        // Redireciona após 60 segundos
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 60000);
                        
                        return false;
                    }
                }
            });
        });
    }, 1000);
}