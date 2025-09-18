/**
 * HemoByte - Gestor de Participações
 * Cuida da magia dos botões "Participar" e sincroniza tudo com o perfil
 */

class CampaignParticipationManager {
    constructor() {
        this.storageKey = 'hemobyte_participations';
        this.participations = this.loadParticipations();
        this.init();
    }

    init() {
        // Precisamos esperar a página carregar antes de mexer nos botões
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupParticipationButtons());
        } else {
            this.setupParticipationButtons();
        }
    }

    loadParticipations() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    saveParticipations() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.participations));
        } catch (error) {
            // Se der erro, vida que segue
        }
    }

    setupParticipationButtons() {
        const buttons = document.querySelectorAll('.participate-button');
        
        buttons.forEach(button => {
            // Pega o ID da campanha do botão
            const campaignId = this.getCampaignId(button);
            
            if (campaignId) {
                // Configura o estado inicial do botão
                this.updateButtonState(button, campaignId);
                
                // Adiciona o evento de clique
                button.addEventListener('click', (e) => {
                    this.handleParticipation(e, button, campaignId);
                });
            }
        });
    }

    getCampaignId(button) {
        // Tenta pegar o ID da campanha de várias formas
        const card = button.closest('.campaign-card');
        if (!card) return null;

        // Primeiro tenta pegar um ID específico
        let campaignId = card.getAttribute('data-campaign-id');
        if (campaignId) return campaignId;

        // Se não tiver, usa o título da campanha
        const titleElement = card.querySelector('h3');
        if (titleElement) {
            return titleElement.textContent.trim().toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
        }

        return null;
    }

    handleParticipation(e, button, campaignId) {
        e.preventDefault();
        
        // Verifica se o usuário está logado
        if (!this.isUserLoggedIn()) {
            this.showProfessionalLoginModal();
            return;
        }

        // Alterna o estado da participação
        if (this.participations[campaignId]) {
            this.removeParticipation(campaignId);
        } else {
            this.addParticipation(campaignId, button);
        }

        // Atualiza o botão e salva
        this.updateButtonState(button, campaignId);
        this.saveParticipations();
    }

    isUserLoggedIn() {
        try {
            const userData = localStorage.getItem('usuario');
            return userData !== null && userData !== 'null';
        } catch (error) {
            return false;
        }
    }

    addParticipation(campaignId, button) {
        const card = button.closest('.campaign-card');
        const titleElement = card.querySelector('h3');
        const title = titleElement ? titleElement.textContent.trim() : 'Campanha';

        this.participations[campaignId] = {
            title: title,
            date: new Date().toISOString(),
            status: 'participating'
        };

        this.showSuccessNotification(title);
    }

    removeParticipation(campaignId) {
        delete this.participations[campaignId];
    }

    updateButtonState(button, campaignId) {
        if (this.participations[campaignId]) {
            button.textContent = 'Participando';
            button.classList.add('participating');
            button.style.backgroundColor = '#28a745';
            button.style.color = 'white';
        } else {
            button.textContent = 'Participar';
            button.classList.remove('participating');
            button.style.backgroundColor = '';
            button.style.color = '';
        }
    }

    showProfessionalLoginModal() {
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

        modalContent.innerHTML = `
            <div style="background: linear-gradient(135deg, #e60000, #cc0000); color: white; padding: 2rem; border-radius: 20px 20px 0 0; text-align: center; position: relative;">
                <button style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.2rem;" onclick="this.closest('.professional-modal').remove();">
                    <i class="fas fa-times"></i>
                </button>
                <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem; animation: pulse 2s infinite;">
                    <i class="fas fa-heart"></i>
                </div>
                <h2 style="margin: 0 0 0.5rem; font-size: 2rem; font-weight: 700;">Participe e Salve Vidas!</h2>
                <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">Faça parte da nossa comunidade de doadores</p>
            </div>
            <div style="padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h3 style="color: #333; margin-bottom: 1rem; font-size: 1.3rem;">
                        <i class="fas fa-shield-alt" style="color: #e60000; margin-right: 0.5rem;"></i>
                        Acesso Necessário
                    </h3>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
                        Para participar de nossas campanhas de doação, você precisa fazer login. 
                        É rápido, seguro e gratuito!
                    </p>
                </div>
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; border-left: 4px solid #28a745;">
                    <h4 style="color: #28a745; margin: 0 0 1rem; display: flex; align-items: center;">
                        <i class="fas fa-check-circle" style="margin-right: 0.5rem;"></i>
                        Benefícios do login:
                    </h4>
                    <ul style="margin: 0; padding-left: 1.2rem; color: #666;">
                        <li>Acompanhe suas participações</li>
                        <li>Receba notificações de campanhas</li>
                        <li>Histórico de doações</li>
                        <li>Certificados digitais</li>
                    </ul>
                </div>
                <div style="display: flex; justify-content: center;">
                    <a href="login.html" style="display: inline-flex; align-items: center; gap: 0.8rem; background: linear-gradient(135deg, #e60000, #cc0000); color: white; padding: 1.2rem 2.5rem; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 1.1rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(230, 0, 0, 0.3);">
                        <i class="fas fa-sign-in-alt"></i>
                        Fazer Login
                    </a>
                </div>
                <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #999; font-size: 0.9rem;">
                        <i class="fas fa-lock" style="margin-right: 0.3rem;"></i>
                        Seus dados estão seguros conosco
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

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Fechar com ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    showSuccessNotification(campaignTitle) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(40, 167, 69, 0.3);
            z-index: 10001;
            max-width: 400px;
            font-family: 'Poppins', sans-serif;
            animation: slideInRight 0.5s ease;
            cursor: pointer;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                    <i class="fas fa-check"></i>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 600;">Participação Confirmada!</h4>
                    <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Você está participando de "${campaignTitle}"</p>
                </div>
                <button style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; opacity: 0.7; transition: opacity 0.3s ease;" onclick="this.parentElement.parentElement.remove();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Adiciona estilos de animação se não existirem
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove automaticamente após 6 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 6000);

        // Remove ao clicar
        notification.addEventListener('click', (e) => {
            if (e.target === notification || e.target.closest('button')) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        });
    }

    renderParticipationsInProfile() {
        const profileSection = document.getElementById('participations-section');
        if (!profileSection) return;

        const participationEntries = Object.entries(this.participations);
        
        if (participationEntries.length === 0) {
            profileSection.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-heart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3 style="margin: 0 0 1rem;">Nenhuma participação ainda</h3>
                    <p style="margin: 0;">Explore as campanhas ativas e participe para salvar vidas!</p>
                </div>
            `;
            return;
        }

        profileSection.innerHTML = `
            <h3 style="color: #e60000; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-heart"></i>
                Suas Participações (${participationEntries.length})
            </h3>
            <div style="display: grid; gap: 1rem;">
                ${participationEntries.map(([id, participation]) => `
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #28a745; display: flex; justify-content: between; align-items: center;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem; color: #333;">${participation.title}</h4>
                            <p style="margin: 0; color: #666; font-size: 0.9rem;">
                                <i class="fas fa-calendar" style="margin-right: 0.5rem;"></i>
                                Participou em ${new Date(participation.date).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div style="background: #28a745; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                            <i class="fas fa-check" style="margin-right: 0.3rem;"></i>
                            Participando
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    clearAllParticipations() {
        this.participations = {};
        this.saveParticipations();
        
        // Atualiza todos os botões na página
        const buttons = document.querySelectorAll('.participate-button');
        buttons.forEach(button => {
            const campaignId = this.getCampaignId(button);
            if (campaignId) {
                this.updateButtonState(button, campaignId);
            }
        });
        
        // Atualiza o perfil se estiver na página
        this.renderParticipationsInProfile();
    }
}

// Inicializa quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    window.campaignParticipationManager = new CampaignParticipationManager();
});

// Limpa participações quando usuário faz logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('#btn-sair, #btn-sair-dropdown');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(() => {
                window.campaignParticipationManager.clearAllParticipations();
            }, 1000);
        });
    });
});