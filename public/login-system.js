/**
 * SISTEMA DE LOGIN OTIMIZADO - HEMOBYTE
 * Clean Architecture + Error Handling + UX
 */

class LoginSystem {
    constructor() {
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupLoginForm();
        this.setupCadastroForm();
        this.setupTabSwitching();
        console.log('📝 Sistema de login inicializado');
    }

    /**
     * Configurar formulário de login
     */
    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.isLoading) return;

            const email = document.getElementById('login-email')?.value;
            const senha = document.getElementById('login-senha')?.value;

            if (!this.validateLoginData(email, senha)) return;

            await this.performLogin(email, senha);
        });
    }

    /**
     * Configurar formulário de cadastro
     */
    setupCadastroForm() {
        const cadastroForm = document.getElementById('cadastro-form');
        if (!cadastroForm) return;

        cadastroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.isLoading) return;

            const dados = this.getCadastroData();
            if (!this.validateCadastroData(dados)) return;

            await this.performCadastro(dados);
        });
    }

    /**
     * Configurar alternância de abas
     */
    setupTabSwitching() {
        const tabLinks = document.querySelectorAll('.tab-link');
        const forms = document.querySelectorAll('.auth-form');

        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Remover classe active de todos
                tabLinks.forEach(l => l.classList.remove('active'));
                forms.forEach(f => f.classList.remove('active'));

                // Adicionar active ao clicado
                link.classList.add('active');

                const tab = link.getAttribute('data-tab');
                const targetForm = document.getElementById(tab + '-form');
                if (targetForm) {
                    targetForm.classList.add('active');
                }
            });
        });
    }

    /**
     * Validar dados de login
     */
    validateLoginData(email, senha) {
        if (!email || !senha) {
            this.showMessage('Email e senha são obrigatórios!', 'error');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Email inválido!', 'error');
            return false;
        }

        if (senha.length < 6) {
            this.showMessage('Senha deve ter pelo menos 6 caracteres!', 'error');
            return false;
        }

        return true;
    }

    /**
     * Obter dados do cadastro
     */
    getCadastroData() {
        return {
            nome: document.getElementById('cadastro-nome')?.value || '',
            email: document.getElementById('cadastro-email')?.value || '',
            telefone: document.getElementById('cadastro-telefone')?.value || '',
            senha: document.getElementById('cadastro-senha')?.value || '',
            confirmar_senha: document.getElementById('cadastro-confirmar-senha')?.value || ''
        };
    }

    /**
     * Validar dados de cadastro
     */
    validateCadastroData(dados) {
        if (!dados.nome || !dados.email || !dados.telefone || !dados.senha || !dados.confirmar_senha) {
            this.showMessage('Todos os campos são obrigatórios!', 'error');
            return false;
        }

        if (!this.isValidEmail(dados.email)) {
            this.showMessage('Email inválido!', 'error');
            return false;
        }

        if (dados.senha !== dados.confirmar_senha) {
            this.showMessage('As senhas não coincidem!', 'error');
            return false;
        }

        if (dados.senha.length < 6) {
            this.showMessage('A senha deve ter pelo menos 6 caracteres!', 'error');
            return false;
        }

        return true;
    }

    /**
     * Realizar login
     */
    async performLogin(email, senha) {
        this.setLoading(true, 'login');

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('senha', senha);

            const response = await fetch('login-simple.php', {
                method: 'POST',
                body: formData
            });

            const text = await response.text();
            const data = JSON.parse(text);

            if (data.success && data.user) {
                // Salvar usuário
                localStorage.setItem('usuario', JSON.stringify(data.user));
                
                // Atualizar sistema de auth
                if (window.authSystem) {
                    window.authSystem.checkUserSession();
                    window.authSystem.updateNavigation();
                }

                this.showMessage('Login realizado com sucesso!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'public/perfil.html';
                }, 1500);

            } else {
                this.showMessage(data.error || 'Erro no login', 'error');
            }

        } catch (error) {
            console.error('Erro no login:', error);
            this.showMessage('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false, 'login');
        }
    }

    /**
     * Realizar cadastro
     */
    async performCadastro(dados) {
        this.setLoading(true, 'cadastro');

        try {
            const formData = new FormData();
            Object.keys(dados).forEach(key => {
                if (key !== 'confirmar_senha') {
                    formData.append(key, dados[key]);
                }
            });

            const response = await fetch('cadastrar-simple.php', {
                method: 'POST',
                body: formData
            });

            const text = await response.text();
            const data = JSON.parse(text);

            if (data.success) {
                this.showMessage('Cadastro realizado com sucesso!', 'success');
                
                // Limpar formulário
                document.getElementById('cadastro-form').reset();
                
                // Alternar para login
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]')?.click();
                }, 1500);

            } else {
                this.showMessage(data.error || 'Erro no cadastro', 'error');
            }

        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showMessage('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false, 'cadastro');
        }
    }

    /**
     * Controlar estado de loading
     */
    setLoading(loading, type) {
        this.isLoading = loading;
        
        const btn = type === 'login' 
            ? document.querySelector('#login-form button[type="submit"]')
            : document.querySelector('#cadastro-form button[type="submit"]');

        if (btn) {
            if (loading) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
                    (type === 'login' ? 'Entrando...' : 'Cadastrando...');
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-' + 
                    (type === 'login' ? 'sign-in-alt"></i> Entrar' : 'user-plus"></i> Cadastrar');
            }
        }
    }

    /**
     * Mostrar mensagem
     */
    showMessage(message, type = 'info') {
        // Remover mensagens anteriores
        const existing = document.querySelector('.auth-message');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = `auth-message auth-message-${type}`;
        div.textContent = message;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#007bff'
        };

        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, 5000);
    }

    /**
     * Validar email
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('login-form') || document.getElementById('cadastro-form')) {
        new LoginSystem();
    }
});

// CSS para animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

