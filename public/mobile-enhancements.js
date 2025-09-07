/**
 * Melhorias Mobile - HemoByte
 * Funcionalidades específicas para dispositivos móveis
 */

class MobileEnhancements {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.init();
    }
    
    init() {
        console.log('📱 Inicializando melhorias mobile...');
        
        // Detectar mudanças de orientação/tamanho
        this.setupResponsiveListeners();
        
        // Configurar menu mobile do admin
        this.setupMobileAdminMenu();
        
        // Melhorar touch interactions
        this.setupTouchEnhancements();
        
        // Otimizar formulários para mobile
        this.setupMobileFormEnhancements();
        
        // Configurar swipe gestures
        this.setupSwipeGestures();
        
        // Melhorar performance em mobile
        this.setupPerformanceOptimizations();
        
        console.log('✅ Melhorias mobile inicializadas!');
    }
    
    /**
     * Configura listeners para mudanças responsivas
     */
    setupResponsiveListeners() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                const wasTablet = this.isTablet;
                
                this.isMobile = window.innerWidth <= 768;
                this.isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
                
                // Se mudou de desktop para mobile ou vice-versa
                if (wasMobile !== this.isMobile || wasTablet !== this.isTablet) {
                    this.handleResponsiveChange();
                }
            }, 250);
        });
        
        // Detectar mudança de orientação
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }
    
    /**
     * Trata mudanças responsivas
     */
    handleResponsiveChange() {
        console.log('📱 Mudança responsiva detectada:', {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            width: window.innerWidth
        });
        
        // Reconfigurar menu admin se necessário
        this.setupMobileAdminMenu();
        
        // Ajustar modais
        this.adjustModalsForMobile();
        
        // Reconfigurar filtros
        this.adjustFiltersForMobile();
    }
    
    /**
     * Trata mudanças de orientação
     */
    handleOrientationChange() {
        // Fechar menu mobile se aberto
        this.closeMobileMenu();
        
        // Reajustar altura de elementos
        this.adjustViewportHeight();
    }
    
    /**
     * Configura menu mobile do admin panel
     */
    setupMobileAdminMenu() {
        if (!document.querySelector('.admin-panel')) return;
        
        // Criar botão de menu mobile se não existir
        if (!document.querySelector('.mobile-menu-toggle')) {
            this.createMobileMenuButton();
        }
        
        // Criar overlay se não existir
        if (!document.querySelector('.mobile-overlay')) {
            this.createMobileOverlay();
        }
        
        // Configurar eventos
        this.setupMobileMenuEvents();
    }
    
    /**
     * Cria botão de menu mobile
     */
    createMobileMenuButton() {
        const button = document.createElement('button');
        button.className = 'mobile-menu-toggle show-mobile';
        button.innerHTML = '<i class="fas fa-bars"></i>';
        button.setAttribute('aria-label', 'Abrir menu');
        button.style.display = this.isMobile ? 'block' : 'none';
        
        document.body.appendChild(button);
    }
    
    /**
     * Cria overlay mobile
     */
    createMobileOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(overlay);
    }
    
    /**
     * Configura eventos do menu mobile
     */
    setupMobileMenuEvents() {
        const menuButton = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (!menuButton || !sidebar || !overlay) return;
        
        // Abrir menu
        menuButton.addEventListener('click', () => {
            this.openMobileMenu();
        });
        
        // Fechar menu clicando no overlay
        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
        
        // Fechar menu com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
                this.closeMobileMenu();
            }
        });
        
        // Fechar menu ao clicar em link de navegação
        const navItems = sidebar.querySelectorAll('.admin-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (this.isMobile) {
                    setTimeout(() => this.closeMobileMenu(), 150);
                }
            });
        });
    }
    
    /**
     * Abre menu mobile
     */
    openMobileMenu() {
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        const button = document.querySelector('.mobile-menu-toggle');
        
        if (sidebar && overlay && button) {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
            button.innerHTML = '<i class="fas fa-times"></i>';
            button.setAttribute('aria-label', 'Fechar menu');
            
            // Prevenir scroll do body
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Fecha menu mobile
     */
    closeMobileMenu() {
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        const button = document.querySelector('.mobile-menu-toggle');
        
        if (sidebar && overlay && button) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
            button.innerHTML = '<i class="fas fa-bars"></i>';
            button.setAttribute('aria-label', 'Abrir menu');
            
            // Restaurar scroll do body
            document.body.style.overflow = '';
        }
    }
    
    /**
     * Melhora interações touch
     */
    setupTouchEnhancements() {
        // Adicionar classe touch em dispositivos touch
        if ('ontouchstart' in window) {
            document.documentElement.classList.add('touch-device');
        }
        
        // Melhorar feedback visual em botões
        this.setupTouchFeedback();
        
        // Configurar scroll suave em containers
        this.setupSmoothScrolling();
    }
    
    /**
     * Configura feedback visual para touch
     */
    setupTouchFeedback() {
        const touchElements = document.querySelectorAll('button, .btn, .campaign-card, .dashboard-card');
        
        touchElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            });
            
            element.addEventListener('touchcancel', () => {
                element.classList.remove('touch-active');
            });
        });
        
        // Adicionar CSS para feedback
        if (!document.querySelector('#touch-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'touch-feedback-styles';
            style.textContent = `
                .touch-active {
                    transform: scale(0.98);
                    opacity: 0.8;
                    transition: all 0.1s ease;
                }
                
                .campaign-card.touch-active,
                .dashboard-card.touch-active {
                    transform: scale(0.98) translateZ(0);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Configura scroll suave
     */
    setupSmoothScrolling() {
        const scrollContainers = document.querySelectorAll('.admin-table-container, .campaigns-grid');
        
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.scrollBehavior = 'smooth';
        });
    }
    
    /**
     * Melhora formulários para mobile
     */
    setupMobileFormEnhancements() {
        // Ajustar inputs para evitar zoom no iOS
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (this.isMobile && input.style.fontSize !== '16px') {
                input.style.fontSize = '16px';
            }
        });
        
        // Melhorar validação em tempo real
        this.setupMobileValidation();
        
        // Configurar teclado virtual
        this.setupVirtualKeyboard();
    }
    
    /**
     * Configura validação mobile
     */
    setupMobileValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Validação mais suave em mobile
                input.addEventListener('blur', () => {
                    if (this.isMobile) {
                        setTimeout(() => {
                            this.validateInput(input);
                        }, 100);
                    }
                });
            });
        });
    }
    
    /**
     * Valida input individual
     */
    validateInput(input) {
        const errorElement = input.parentElement.querySelector('.field-error');
        
        if (input.checkValidity()) {
            input.classList.remove('invalid');
            input.classList.add('valid');
            if (errorElement) errorElement.remove();
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
            
            if (!errorElement) {
                const error = document.createElement('span');
                error.className = 'field-error';
                error.textContent = input.validationMessage;
                input.parentElement.appendChild(error);
            }
        }
    }
    
    /**
     * Configura teclado virtual
     */
    setupVirtualKeyboard() {
        if (!this.isMobile) return;
        
        let initialViewportHeight = window.innerHeight;
        
        // Detectar abertura/fechamento do teclado virtual
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            if (heightDifference > 150) {
                // Teclado aberto
                document.body.classList.add('keyboard-open');
                this.adjustForKeyboard(true);
            } else {
                // Teclado fechado
                document.body.classList.remove('keyboard-open');
                this.adjustForKeyboard(false);
            }
        });
    }
    
    /**
     * Ajusta interface para teclado virtual
     */
    adjustForKeyboard(isOpen) {
        const fixedElements = document.querySelectorAll('.mobile-menu-toggle, #notification-container');
        
        fixedElements.forEach(element => {
            if (isOpen) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });
    }
    
    /**
     * Configura gestos de swipe
     */
    setupSwipeGestures() {
        if (!this.isMobile) return;
        
        // Swipe para abrir/fechar menu admin
        this.setupAdminMenuSwipe();
        
        // Swipe em cards de campanha
        this.setupCampaignCardSwipe();
    }
    
    /**
     * Configura swipe do menu admin
     */
    setupAdminMenuSwipe() {
        const adminMain = document.querySelector('.admin-main');
        if (!adminMain) return;
        
        adminMain.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        });
        
        adminMain.addEventListener('touchmove', (e) => {
            if (!this.touchStartX) return;
            
            const touchX = e.touches[0].clientX;
            const diffX = touchX - this.touchStartX;
            
            // Swipe da esquerda para direita para abrir menu
            if (diffX > 50 && this.touchStartX < 50) {
                this.openMobileMenu();
                this.touchStartX = 0;
            }
        });
        
        adminMain.addEventListener('touchend', () => {
            this.touchStartX = 0;
        });
    }
    
    /**
     * Configura swipe em cards
     */
    setupCampaignCardSwipe() {
        const cards = document.querySelectorAll('.campaign-card');
        
        cards.forEach(card => {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                card.style.transition = 'none';
            });
            
            card.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentX = e.touches[0].clientX;
                const diffX = currentX - startX;
                
                // Limitar movimento
                const maxMove = 100;
                const moveX = Math.max(-maxMove, Math.min(maxMove, diffX));
                
                card.style.transform = `translateX(${moveX}px)`;
            });
            
            card.addEventListener('touchend', () => {
                if (!isDragging) return;
                
                isDragging = false;
                card.style.transition = 'transform 0.3s ease';
                card.style.transform = 'translateX(0)';
                
                const diffX = currentX - startX;
                
                // Ações baseadas no swipe
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        // Swipe para direita - ação positiva
                        this.handleCardSwipeRight(card);
                    } else {
                        // Swipe para esquerda - ação negativa
                        this.handleCardSwipeLeft(card);
                    }
                }
                
                startX = 0;
                currentX = 0;
            });
        });
    }
    
    /**
     * Trata swipe para direita em card
     */
    handleCardSwipeRight(card) {
        // Implementar ação (ex: curtir, aprovar)
        console.log('👍 Swipe direita no card:', card);
        
        // Feedback visual
        this.showSwipeFeedback(card, 'right');
    }
    
    /**
     * Trata swipe para esquerda em card
     */
    handleCardSwipeLeft(card) {
        // Implementar ação (ex: rejeitar, arquivar)
        console.log('👎 Swipe esquerda no card:', card);
        
        // Feedback visual
        this.showSwipeFeedback(card, 'left');
    }
    
    /**
     * Mostra feedback visual do swipe
     */
    showSwipeFeedback(card, direction) {
        const feedback = document.createElement('div');
        feedback.className = `swipe-feedback swipe-${direction}`;
        feedback.innerHTML = direction === 'right' ? '👍' : '👎';
        
        card.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }
    
    /**
     * Otimizações de performance para mobile
     */
    setupPerformanceOptimizations() {
        // Lazy loading de imagens
        this.setupLazyLoading();
        
        // Debounce de eventos
        this.setupEventDebouncing();
        
        // Otimizar animações
        this.optimizeAnimations();
    }
    
    /**
     * Configura lazy loading
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    /**
     * Configura debounce de eventos
     */
    setupEventDebouncing() {
        // Debounce de scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Ações de scroll
            }, 100);
        }, { passive: true });
    }
    
    /**
     * Otimiza animações para mobile
     */
    optimizeAnimations() {
        if (this.isMobile) {
            // Reduzir duração de animações
            const style = document.createElement('style');
            style.textContent = `
                * {
                    animation-duration: 0.2s !important;
                    transition-duration: 0.2s !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Ajusta modais para mobile
     */
    adjustModalsForMobile() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            if (this.isMobile) {
                modal.classList.add('mobile-modal');
            } else {
                modal.classList.remove('mobile-modal');
            }
        });
    }
    
    /**
     * Ajusta filtros para mobile
     */
    adjustFiltersForMobile() {
        const filtersContainer = document.querySelector('.filters-container');
        
        if (filtersContainer) {
            if (this.isMobile) {
                filtersContainer.classList.add('mobile-filters');
            } else {
                filtersContainer.classList.remove('mobile-filters');
            }
        }
    }
    
    /**
     * Ajusta altura do viewport
     */
    adjustViewportHeight() {
        // Corrigir problema de altura em mobile
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    /**
     * Utilitários
     */
    
    // Detectar se é dispositivo touch
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    // Detectar orientação
    getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    
    // Obter informações do dispositivo
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isTouch: this.isTouchDevice(),
            orientation: this.getOrientation(),
            width: window.innerWidth,
            height: window.innerHeight,
            userAgent: navigator.userAgent
        };
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.mobileEnhancements = new MobileEnhancements();
});

console.log('📱 Sistema de melhorias mobile carregado!');
