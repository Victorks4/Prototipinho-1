/**
 * SISTEMA DE NAVEGAÇÃO GLOBAL - HEMOBYTE
 * Controla exibição de login/perfil em todas as páginas
 */

console.log('Sistema de navegação global carregado');

// Função para atualizar a navegação em todas as páginas
function atualizarNavegacaoGlobal() {
    console.log('Atualizando navegação...');
    
    // Verificar se usuário está logado
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    console.log('Usuário logado:', usuario);
    
    // Elementos de navegação (podem existir ou não dependendo da página)
    const navLogin = document.getElementById('nav-login');
    const navProfile = document.getElementById('nav-profile');
    const userName = document.querySelector('.user-name');
    const profileLink = document.querySelector('.profile-link');
    
    if (usuario) {
        // USUÁRIO LOGADO
        console.log('Usuário logado detectado:', usuario.nome);
        
        // Esconder botão de login
        if (navLogin) {
            navLogin.style.display = 'none';
        }
        
        // Mostrar perfil
        if (navProfile) {
            navProfile.style.display = 'block';
        }
        
        // Atualizar nome do usuário
        if (userName) {
            userName.textContent = usuario.nome.split(' ')[0]; // Primeiro nome
        }
        
        // Verificar se existe link de perfil e atualizar
        if (profileLink) {
            profileLink.href = getProfilePath();
        }
        
    } else {
        // USUÁRIO NÃO LOGADO
        console.log('Usuário não logado');
        
        // Mostrar botão de login
        if (navLogin) {
            navLogin.style.display = 'block';
        }
        
        // Esconder perfil
        if (navProfile) {
            navProfile.style.display = 'none';
        }
    }
}

// Função para determinar o caminho correto do perfil baseado na página atual
function getProfilePath() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/public/')) {
        // Já estamos dentro da pasta public
        return 'perfil.html';
    } else {
        // Estamos na raiz do projeto
        return 'public/perfil.html';
    }
}

// Função para fazer logout
function fazerLogout() {
    console.log('Fazendo logout...');
    
    // Remover dados do localStorage
    localStorage.removeItem('usuario');
    
    // Mostrar mensagem
    alert('Logout realizado com sucesso!');
    
    // Redirecionar para página inicial
    window.location.href = getHomePath();
}

// Função para determinar caminho da home
function getHomePath() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/public/')) {
        return '../index.html';
    } else {
        return 'index.html';
    }
}

// Função para verificar se deve mostrar mensagens de admin
function deveExibirMensagensAdmin() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    return !usuario; // Só mostra se NÃO estiver logado
}

// Bloquear notificações de admin se usuário estiver logado
function bloquearNotificacoes() {
    if (!deveExibirMensagensAdmin()) {
        // Bloquear console.warn que pode gerar notificações
        const originalWarn = console.warn;
        console.warn = function(...args) {
            const message = args.join(' ');
            if (message.includes('admin') || message.includes('login')) {
                return; // Bloquear mensagem
            }
            originalWarn.apply(console, args);
        };
        
        // Bloquear possíveis notificações do navegador
        if ('Notification' in window) {
            const originalNotification = window.Notification;
            window.Notification = function(title, options) {
                if (title.includes('admin') || title.includes('login')) {
                    return; // Bloquear notificação
                }
                return new originalNotification(title, options);
            };
        }
    }
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando navegação global...');
    
    // Bloquear notificações se necessário
    bloquearNotificacoes();
    
    // Atualizar navegação
    atualizarNavegacaoGlobal();
    
    // Adicionar evento de logout se existir botão
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', function(e) {
            e.preventDefault();
            fazerLogout();
        });
    }
    
    // Verificar se há botões de sair em outras partes da página
    const logoutButtons = document.querySelectorAll('[data-action="logout"], .btn-logout, .logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            fazerLogout();
        });
    });
});

// Atualizar navegação quando localStorage mudar (entre abas)
window.addEventListener('storage', function(e) {
    if (e.key === 'usuario') {
        console.log('Mudança detectada no localStorage, atualizando navegação...');
        atualizarNavegacaoGlobal();
    }
});

// Expor função globalmente para uso em outras páginas
window.atualizarNavegacao = atualizarNavegacaoGlobal;
