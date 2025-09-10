/**
 * LOGIN SUPER SIMPLES - HEMOBYTE
 * Versão que vai funcionar 100%
 */

console.log('Script de login carregado');

// Função para mostrar mensagem
function mostrarMensagem(msg, tipo = 'info') {
    alert(msg); // Simples mas funciona
}

// Quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, configurando eventos...');
    
    // LOGIN
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('Formulário de login encontrado');
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Formulário de login enviado');
            
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;
            
            console.log('Email:', email, 'Senha:', senha ? 'OK' : 'VAZIA');
            
            if (!email || !senha) {
                mostrarMensagem('Email e senha são obrigatórios!');
                return;
            }
            
            // Criar FormData
            const formData = new FormData();
            formData.append('email', email);
            formData.append('senha', senha);
            
            // Mostrar loading
            const btnSubmit = loginForm.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            btnSubmit.disabled = true;
            
            // Fazer requisição
            fetch('login-simple.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Response status:', response.status);
                return response.text();
            })
            .then(text => {
                console.log('Response text:', text);
                
                try {
                    const data = JSON.parse(text);
                    
                    if (data.success && data.user) {
                        // Salvar no localStorage
                        localStorage.setItem('usuario', JSON.stringify(data.user));
                        
                        mostrarMensagem('Login realizado com sucesso!');
                        
                        // Redirecionar
                        setTimeout(() => {
                            window.location.href = 'public/perfil.html';
                        }, 1000);
                        
                    } else {
                        mostrarMensagem('Erro: ' + (data.error || 'Erro desconhecido'));
                    }
                    
                } catch (e) {
                    console.error('Erro ao processar JSON:', e);
                    mostrarMensagem('Erro na resposta do servidor: ' + text);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                mostrarMensagem('Erro de conexão: ' + error.message);
            })
            .finally(() => {
                // Restaurar botão
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            });
        });
    }
    
    // CADASTRO
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) {
        console.log('Formulário de cadastro encontrado');
        
        cadastroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Formulário de cadastro enviado');
            
            const nome = document.getElementById('cadastro-nome').value;
            const email = document.getElementById('cadastro-email').value;
            const telefone = document.getElementById('cadastro-telefone').value;
            const senha = document.getElementById('cadastro-senha').value;
            const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;
            
            // Validações
            if (!nome || !email || !telefone || !senha || !confirmarSenha) {
                mostrarMensagem('Todos os campos são obrigatórios!');
                return;
            }
            
            if (senha !== confirmarSenha) {
                mostrarMensagem('As senhas não coincidem!');
                return;
            }
            
            if (senha.length < 6) {
                mostrarMensagem('A senha deve ter pelo menos 6 caracteres!');
                return;
            }
            
            // Criar FormData
            const formData = new FormData();
            formData.append('nome', nome);
            formData.append('email', email);
            formData.append('telefone', telefone);
            formData.append('senha', senha);
            
            // Mostrar loading
            const btnSubmit = cadastroForm.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            btnSubmit.disabled = true;
            
            // Fazer requisição
            fetch('cadastrar-simple.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Cadastro response status:', response.status);
                return response.text();
            })
            .then(text => {
                console.log('Cadastro response text:', text);
                
                try {
                    const data = JSON.parse(text);
                    
                    if (data.success) {
                        mostrarMensagem('Cadastro realizado com sucesso!');
                        
                        // Limpar formulário
                        cadastroForm.reset();
                        
                        // Alternar para aba de login
                        setTimeout(() => {
                            const loginTab = document.querySelector('[data-tab="login"]');
                            if (loginTab) {
                                loginTab.click();
                            }
                        }, 1000);
                        
                    } else {
                        mostrarMensagem('Erro: ' + (data.error || 'Erro desconhecido'));
                    }
                    
                } catch (e) {
                    console.error('Erro ao processar JSON:', e);
                    mostrarMensagem('Erro na resposta do servidor: ' + text);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                mostrarMensagem('Erro de conexão: ' + error.message);
            })
            .finally(() => {
                // Restaurar botão
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            });
        });
    }
});

console.log('Script de login configurado');

