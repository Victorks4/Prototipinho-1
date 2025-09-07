/**
 * Melhorias de Acessibilidade e UX - HemoByte
 * Implementa funcionalidades JavaScript para melhorar a experiência do usuário
 */

class AccessibilityManager {
    constructor() {
        this.init();
    }

    init() {
        this.addProgressBarLabels();
        this.setupFormValidation();
        this.setupLoadingStates();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupTabNavigation();
        this.announcePageChanges();
    }

    /**
     * Adiciona labels ARIA para barras de progresso
     */
    addProgressBarLabels() {
        document.querySelectorAll('.progress-bar').forEach((bar, index) => {
            const progress = bar.querySelector('.progress');
            if (progress && progress.style.width) {
                const width = progress.style.width;
                const value = parseInt(width);
                
                // Adiciona atributos ARIA se não existirem
                if (!bar.getAttribute('role')) {
                    bar.setAttribute('role', 'progressbar');
                    bar.setAttribute('aria-valuenow', value);
                    bar.setAttribute('aria-valuemin', '0');
                    bar.setAttribute('aria-valuemax', '100');
                    bar.setAttribute('aria-label', `Progresso da campanha: ${value}%`);
                }
            }
        });
    }

    /**
     * Configura validação de formulários em tempo real
     */
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Validação em tempo real
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });

            // Validação no submit
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    this.focusFirstError(form);
                }
            });
        });
    }

    /**
     * Valida um campo individual
     */
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        let isValid = true;
        let errorMessage = '';

        // Remove classes anteriores
        field.classList.remove('valid', 'invalid');
        this.removeFieldError(field);

        // Validação de campo obrigatório
        if (required && !value) {
            isValid = false;
            errorMessage = 'Este campo é obrigatório';
        }
        // Validação de email
        else if (type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Digite um email válido';
        }
        // Validação de senha
        else if (type === 'password' && value && value.length < 8) {
            isValid = false;
            errorMessage = 'A senha deve ter pelo menos 8 caracteres';
        }
        // Validação de telefone
        else if (type === 'tel' && value && !this.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Digite um telefone válido';
        }

        // Aplica resultado da validação
        if (isValid) {
            field.classList.add('valid');
            field.setAttribute('aria-invalid', 'false');
        } else {
            field.classList.add('invalid');
            field.setAttribute('aria-invalid', 'true');
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Valida formulário completo
     */
    validateForm(form) {
        const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Mostra erro de campo
     */
    showFieldError(field, message) {
        const errorId = `${field.id}-error`;
        let errorElement = document.getElementById(errorId);

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'field-error';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${errorId}`.trim());
    }

    /**
     * Remove erro de campo
     */
    removeFieldError(field) {
        const errorId = `${field.id}-error`;
        const errorElement = document.getElementById(errorId);
        
        if (errorElement) {
            errorElement.remove();
        }

        // Remove referência do aria-describedby
        const describedBy = field.getAttribute('aria-describedby');
        if (describedBy) {
            const newDescribedBy = describedBy.replace(errorId, '').trim();
            if (newDescribedBy) {
                field.setAttribute('aria-describedby', newDescribedBy);
            } else {
                field.removeAttribute('aria-describedby');
            }
        }
    }

    /**
     * Limpa erro de campo durante digitação
     */
    clearFieldError(field) {
        if (field.classList.contains('invalid')) {
            field.classList.remove('invalid');
            field.setAttribute('aria-invalid', 'false');
            this.removeFieldError(field);
        }
    }

    /**
     * Foca no primeiro campo com erro
     */
    focusFirstError(form) {
        const firstError = form.querySelector('.invalid');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Configura estados de loading
     */
    setupLoadingStates() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', () => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    this.setLoadingState(submitBtn, true);
                    
                    // Remove loading após 3 segundos (fallback)
                    setTimeout(() => {
                        this.setLoadingState(submitBtn, false);
                    }, 3000);
                }
            });
        });
    }

    /**
     * Define estado de loading de um botão
     */
    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.setAttribute('data-loading', 'true');
            button.setAttribute('aria-busy', 'true');
            button.disabled = true;
            
            const textSpan = button.querySelector('.btn-text');
            const loadingSpan = button.querySelector('.btn-loading');
            
            if (textSpan) textSpan.style.display = 'none';
            if (loadingSpan) loadingSpan.style.display = 'inline-flex';
        } else {
            button.setAttribute('data-loading', 'false');
            button.setAttribute('aria-busy', 'false');
            button.disabled = false;
            
            const textSpan = button.querySelector('.btn-text');
            const loadingSpan = button.querySelector('.btn-loading');
            
            if (textSpan) textSpan.style.display = 'inline-flex';
            if (loadingSpan) loadingSpan.style.display = 'none';
        }
    }

    /**
     * Configura navegação por teclado
     */
    setupKeyboardNavigation() {
        // Navegação por tabs
        document.addEventListener('keydown', (e) => {
            // ESC para fechar modais
            if (e.key === 'Escape') {
                this.closeModals();
            }
            
            // Enter em links com role="button"
            if (e.key === 'Enter' && e.target.getAttribute('role') === 'button') {
                e.target.click();
            }
        });
    }

    /**
     * Configura gerenciamento de foco
     */
    setupFocusManagement() {
        // Trap focus em modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal:not([style*="display: none"])');
                if (modal) {
                    this.trapFocus(e, modal);
                }
            }
        });

        // Restaura foco após fechar modal
        this.lastFocusedElement = null;
    }

    /**
     * Prende foco dentro de um elemento
     */
    trapFocus(event, element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    /**
     * Configura navegação por abas
     */
    setupTabNavigation() {
        document.querySelectorAll('[role="tablist"]').forEach(tablist => {
            const tabs = tablist.querySelectorAll('[role="tab"]');
            
            tabs.forEach((tab, index) => {
                tab.addEventListener('keydown', (e) => {
                    let newIndex = index;
                    
                    switch (e.key) {
                        case 'ArrowRight':
                        case 'ArrowDown':
                            newIndex = (index + 1) % tabs.length;
                            break;
                        case 'ArrowLeft':
                        case 'ArrowUp':
                            newIndex = (index - 1 + tabs.length) % tabs.length;
                            break;
                        case 'Home':
                            newIndex = 0;
                            break;
                        case 'End':
                            newIndex = tabs.length - 1;
                            break;
                        default:
                            return;
                    }
                    
                    e.preventDefault();
                    tabs[newIndex].focus();
                    tabs[newIndex].click();
                });
            });
        });
    }

    /**
     * Anuncia mudanças de página para screen readers
     */
    announcePageChanges() {
        // Cria região de anúncios
        if (!document.getElementById('announcements')) {
            const announcer = document.createElement('div');
            announcer.id = 'announcements';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }

        // Anuncia título da página
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
            this.announce(`Página carregada: ${pageTitle.textContent}`);
        }
    }

    /**
     * Anuncia mensagem para screen readers
     */
    announce(message) {
        const announcer = document.getElementById('announcements');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    /**
     * Fecha modais abertos
     */
    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
                
                // Restaura foco
                if (this.lastFocusedElement) {
                    this.lastFocusedElement.focus();
                    this.lastFocusedElement = null;
                }
            }
        });
    }

    /**
     * Validadores auxiliares
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    }
}

/**
 * Gerenciador de notificações acessíveis
 */
class NotificationManager {
    constructor() {
        this.createContainer();
    }

    createContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'false');
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <i class="${icon}" aria-hidden="true"></i>
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Fechar notificação">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;

        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        // Remove ao clicar no X
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }

    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Inicialização quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa gerenciadores
    window.accessibilityManager = new AccessibilityManager();
    window.notificationManager = new NotificationManager();

    // Adiciona indicador de página atual na navegação
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    // Melhora acessibilidade de elementos existentes
    setTimeout(() => {
        // Adiciona labels para elementos sem
        document.querySelectorAll('img:not([alt])').forEach(img => {
            img.setAttribute('alt', 'Imagem decorativa');
        });

        // Adiciona roles para elementos semânticos
        document.querySelectorAll('main:not([role])').forEach(main => {
            main.setAttribute('role', 'main');
        });

        document.querySelectorAll('nav:not([role])').forEach(nav => {
            nav.setAttribute('role', 'navigation');
        });

        // Breadcrumb removido conforme solicitado

        // Melhora botões de ação
        document.querySelectorAll('.campaign-button, .participate-button').forEach(btn => {
            if (!btn.getAttribute('aria-describedby')) {
                const campaignTitle = btn.closest('.campaign-card')?.querySelector('h3')?.textContent;
                if (campaignTitle) {
                    btn.setAttribute('aria-label', `Participar da campanha: ${campaignTitle}`);
                }
            }
        });

        // Força aplicação dos estilos de correção
        const uxFixesLink = document.querySelector('link[href*="ux-fixes.css"]');
        if (!uxFixesLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'public/ux-fixes.css';
            document.head.appendChild(link);
        }
    }, 100);
});

// Exporta para uso global
window.AccessibilityManager = AccessibilityManager;
window.NotificationManager = NotificationManager;
