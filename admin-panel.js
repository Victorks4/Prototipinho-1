/**
 * Sistema de Administração - HemoByte
 * Gerencia todas as funcionalidades do painel administrativo
 */

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.campaigns = [];
        this.users = [];
        this.images = [];
        this.settings = {};
        
        this.init();
    }

    init() {
        // Verifica autenticação
        if (!this.isAuthenticated()) {
            window.location.href = 'admin-login.html';
            return;
        }

        this.setupEventListeners();
        this.loadInitialData();
        this.updateStats();
        this.setupSyncIndicator();
    }

    isAuthenticated() {
        const session = localStorage.getItem('adminSession');
        if (!session) return false;

        try {
            const adminSession = JSON.parse(session);
            const loginTime = new Date(adminSession.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

            return hoursDiff < 8; // Sessão expira em 8 horas
        } catch (e) {
            return false;
        }
    }

    setupEventListeners() {
        // Navegação do sidebar
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Menu mobile
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                document.getElementById('admin-sidebar').classList.toggle('open');
            });
        }

        // Upload de imagens
        this.setupImageUpload();

        // Configurações do site
        this.setupSiteControls();
    }

    showSection(sectionName) {
        // Remove active de todas as seções
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });

        // Ativa a seção selecionada
        document.getElementById(sectionName).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).setAttribute('aria-current', 'page');

        // Atualiza título
        const titles = {
            'dashboard': 'Dashboard',
            'campaigns': 'Gerenciar Campanhas',
            'images': 'Gerenciar Imagens',
            'site-control': 'Controle do Site',
            'users': 'Gerenciar Usuários',
            'logs': 'Logs do Sistema'
        };

        document.getElementById('current-section-title').textContent = titles[sectionName];
        this.currentSection = sectionName;

        // Carrega dados específicos da seção
        this.loadSectionData(sectionName);
    }

    loadSectionData(section) {
        switch (section) {
            case 'campaigns':
                this.loadCampaigns();
                break;
            case 'images':
                this.loadImages();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    loadInitialData() {
        // Carrega dados iniciais do localStorage ou API
        this.campaigns = JSON.parse(localStorage.getItem('adminCampaigns') || '[]');
        this.users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        this.images = JSON.parse(localStorage.getItem('adminImages') || '[]');
        this.settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');

        // Dados iniciais se não existirem
        if (this.campaigns.length === 0) {
            this.campaigns = [
                {
                    id: 1,
                    title: 'Campanha de Doação - Feira VI',
                    location: 'Feira VI, Feira de Santana',
                    date: '2024-05-15',
                    time: '08:00 - 17:00',
                    status: 'pending',
                    category: 'urgente',
                    bloodType: 'A+',
                    goal: 50,
                    current: 30,
                    description: 'Campanha urgente para atender demanda do Hospital Geral',
                    organizer: 'João Silva',
                    organizerEmail: 'joao@email.com',
                    organizerPhone: '(75) 98182-9675',
                    createdAt: '2024-05-10T10:00:00Z',
                    submittedBy: 'user'
                },
                {
                    id: 2,
                    title: 'Doação Emergencial - Centro',
                    location: 'Centro, Feira de Santana',
                    date: '2024-05-16',
                    time: '09:00 - 16:00',
                    status: 'approved',
                    category: 'urgente', // ✅ Categoria correta para seção urgente
                    bloodType: 'O-',
                    goal: 30,
                    current: 12,
                    description: 'Emergência médica requer doadores tipo O- urgentemente',
                    organizer: 'Maria Santos',
                    organizerEmail: 'maria@email.com',
                    organizerPhone: '(75) 99999-8888',
                    createdAt: '2024-05-08T14:30:00Z',
                    approvedAt: '2024-05-09T09:15:00Z',
                    submittedBy: 'user'
                },
                {
                    id: 3,
                    title: 'Doe Vida - Tomba',
                    location: 'Tomba, Feira de Santana',
                    date: '2024-05-20',
                    time: '09:00 - 16:00',
                    status: 'approved',
                    category: 'ativa', // ✅ ATIVA - não urgente
                    bloodType: 'B+',   // ✅ B+ não é O-, então vai para seção ATIVA
                    goal: 40,
                    current: 25,
                    description: 'Campanha comunitária no bairro Tomba',
                    organizer: 'Carlos Oliveira',
                    organizerEmail: 'carlos@email.com',
                    organizerPhone: '(75) 97777-6666',
                    createdAt: '2024-05-05T16:45:00Z',
                    approvedAt: '2024-05-06T11:20:00Z',
                    submittedBy: 'user'
                },
                {
                    id: 4,
                    title: 'Campanha Universitária - UEFS',
                    location: 'UEFS, Feira de Santana',
                    date: '2024-05-22',
                    time: '08:00 - 17:00',
                    status: 'pending',
                    category: 'planejamento',
                    bloodType: 'AB+',
                    goal: 35,
                    current: 18,
                    description: 'Campanha realizada na Universidade Estadual de Feira de Santana',
                    organizer: 'Ana Paula',
                    organizerEmail: 'ana.paula@uefs.br',
                    organizerPhone: '(75) 96666-5555',
                    createdAt: '2024-05-12T08:30:00Z',
                    submittedBy: 'user'
                },
                {
                    id: 5,
                    title: 'Solidariedade - Queimadinha',
                    location: 'Queimadinha, Feira de Santana',
                    date: '2024-05-25',
                    time: '07:00 - 15:00',
                    status: 'rejected',
                    category: 'ativa',
                    bloodType: 'A-',
                    goal: 25,
                    current: 0,
                    description: 'Campanha comunitária no bairro Queimadinha',
                    organizer: 'Pedro Costa',
                    organizerEmail: 'pedro@email.com',
                    organizerPhone: '(75) 95555-4444',
                    createdAt: '2024-05-11T13:20:00Z',
                    rejectedAt: '2024-05-13T10:45:00Z',
                    rejectionReason: 'Documentação incompleta',
                    submittedBy: 'user'
                },
                {
                    id: 6,
                    title: 'Campanha Empresarial - Shopping',
                    location: 'Shopping Boulevard, Feira de Santana',
                    date: '2024-05-28',
                    time: '10:00 - 18:00',
                    status: 'pending',
                    category: 'planejamento',
                    bloodType: 'O+',
                    goal: 60,
                    current: 0,
                    description: 'Campanha corporativa em parceria com o Shopping Boulevard',
                    organizer: 'Empresa HemoAjuda',
                    organizerEmail: 'contato@hemoajuda.com',
                    organizerPhone: '(75) 94444-3333',
                    createdAt: '2024-05-14T11:15:00Z',
                    submittedBy: 'user'
                },
                // ✅ NOVAS CAMPANHAS ATIVAS ADICIONADAS
                {
                    id: 10,
                    title: 'Doação Comunitária - Cidade Nova',
                    location: 'Cidade Nova, Feira de Santana',
                    date: '2024-05-28',
                    time: '07:00 - 16:00',
                    status: 'approved',
                    category: 'ativa',
                    bloodType: 'A+',
                    goal: 45,
                    current: 22,
                    description: 'Campanha para atender hospitais da região',
                    organizer: 'Carlos Silva',
                    organizerEmail: 'carlos@email.com',
                    organizerPhone: '(75) 98765-4321',
                    createdAt: '2024-05-18T09:00:00Z',
                    approvedAt: '2024-05-18T14:20:00Z',
                    submittedBy: 'user'
                },
                {
                    id: 11,
                    title: 'Sangue Solidário - Kalilândia',
                    location: 'Kalilândia, Feira de Santana',
                    date: '2024-05-30',
                    time: '08:00 - 17:00',
                    status: 'approved',
                    category: 'ativa',
                    bloodType: 'B-',
                    goal: 25,
                    current: 8,
                    description: 'Campanha para tipos sanguíneos raros',
                    organizer: 'Fernanda Lima',
                    organizerEmail: 'fernanda@email.com',
                    organizerPhone: '(75) 99887-6655',
                    createdAt: '2024-05-20T13:45:00Z',
                    approvedAt: '2024-05-20T18:10:00Z',
                    submittedBy: 'user'
                },
                {
                    id: 12,
                    title: 'Vida em Movimento - Rua Nova',
                    location: 'Rua Nova, Feira de Santana',
                    date: '2024-06-02',
                    time: '09:00 - 15:00',
                    status: 'approved',
                    category: 'ativa',
                    bloodType: 'AB+',
                    goal: 20,
                    current: 12,
                    description: 'Campanha especial para receptores universais',
                    organizer: 'Roberto Mendes',
                    organizerEmail: 'roberto@email.com',
                    organizerPhone: '(75) 97654-3210',
                    createdAt: '2024-05-22T16:20:00Z',
                    approvedAt: '2024-05-22T19:45:00Z',
                    submittedBy: 'user'
                }
            ];
            this.saveCampaigns();
        }

        if (this.users.length === 0) {
            this.users = [
                {
                    id: 1,
                    name: 'João Silva',
                    email: 'joao@email.com',
                    registrationDate: '2024-05-10',
                    status: 'active'
                },
                {
                    id: 2,
                    name: 'Maria Santos',
                    email: 'maria@email.com',
                    registrationDate: '2024-05-12',
                    status: 'active'
                }
            ];
            this.saveUsers();
        }
    }

    updateStats() {
        const totalCampaigns = this.campaigns.filter(c => c.status === 'approved').length;
        const pendingCampaigns = this.campaigns.filter(c => c.status === 'pending').length;
        const totalDonations = this.campaigns.reduce((sum, c) => sum + (c.current || 0), 0);
        const totalUsers = this.users.length;

        document.getElementById('total-campaigns').textContent = totalCampaigns;
        document.getElementById('pending-campaigns').textContent = pendingCampaigns;
        document.getElementById('total-donations').textContent = totalDonations;
        document.getElementById('total-users').textContent = totalUsers;
    }

    // ==========================================
    // GERENCIAMENTO DE CAMPANHAS
    // ==========================================

    loadCampaigns() {
        const tbody = document.getElementById('campaigns-tbody');
        tbody.innerHTML = '';

        // Ordenar campanhas: pendentes primeiro, depois por data de criação
        const sortedCampaigns = [...this.campaigns].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (b.status === 'pending' && a.status !== 'pending') return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        sortedCampaigns.forEach(campaign => {
            const row = document.createElement('tr');
            
            const statusClass = {
                'pending': 'status-pending',
                'approved': 'status-approved',
                'rejected': 'status-rejected'
            }[campaign.status];

            const statusText = {
                'pending': 'Pendente',
                'approved': 'Aprovada',
                'rejected': 'Rejeitada'
            }[campaign.status];

            // Adicionar classe para destacar campanhas pendentes
            if (campaign.status === 'pending') {
                row.style.backgroundColor = '#fef3c7';
            } else if (campaign.status === 'rejected') {
                row.style.backgroundColor = '#fee2e2';
            }

            const categoryInfo = {
                'urgente': { icon: '🚨', text: 'Urgente', color: '#ef4444', bg: '#fee2e2' },
                'ativa': { icon: '✅', text: 'Ativa', color: '#10b981', bg: '#d1fae5' },
                'planejamento': { icon: '📋', text: 'Planejamento', color: '#3b82f6', bg: '#dbeafe' }
            }[campaign.category] || { icon: '✅', text: 'Ativa', color: '#10b981', bg: '#d1fae5' };

            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${campaign.title}</div>
                    <div style="font-size: 0.8rem; color: #666;">
                        Organizado por: ${campaign.organizer}<br>
                        Tipo: ${campaign.bloodType} | Meta: ${campaign.goal} doadores
                    </div>
                </td>
                <td>
                    <div>${campaign.location}</div>
                    <div style="font-size: 0.8rem; color: #666;">
                        ${this.formatDate(campaign.date)} - ${campaign.time}
                    </div>
                </td>
                <td>
                    <div style="
                        display: inline-block;
                        padding: 0.5rem 0.75rem;
                        background: ${categoryInfo.bg};
                        color: ${categoryInfo.color};
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        border: 2px solid ${categoryInfo.color};
                    ">
                        ${categoryInfo.icon} ${categoryInfo.text}
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <button onclick="adminPanel.changeCampaignCategory(${campaign.id})" style="
                            background: none;
                            border: 1px solid #d1d5db;
                            color: #6b7280;
                            padding: 0.25rem 0.5rem;
                            border-radius: 4px;
                            font-size: 0.7rem;
                            cursor: pointer;
                        ">
                            <i class="fas fa-edit"></i> Alterar
                        </button>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.8rem; color: #666;">
                        Criada: ${this.formatDateTime(campaign.createdAt)}
                    </div>
                    ${campaign.approvedAt ? `<div style="font-size: 0.8rem; color: #10b981;">Aprovada: ${this.formatDateTime(campaign.approvedAt)}</div>` : ''}
                    ${campaign.rejectedAt ? `<div style="font-size: 0.8rem; color: #ef4444;">Rejeitada: ${this.formatDateTime(campaign.rejectedAt)}</div>` : ''}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${campaign.status === 'rejected' && campaign.rejectionReason ? `
                        <div style="font-size: 0.7rem; color: #ef4444; margin-top: 0.25rem;">
                            ${campaign.rejectionReason}
                        </div>
                    ` : ''}
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        ${campaign.status === 'pending' ? `
                            <button class="action-btn btn-approve" onclick="adminPanel.approveCampaign(${campaign.id})" style="width: 100%;">
                                <i class="fas fa-check"></i> Aprovar
                            </button>
                            <button class="action-btn btn-reject" onclick="adminPanel.rejectCampaign(${campaign.id})" style="width: 100%;">
                                <i class="fas fa-times"></i> Rejeitar
                            </button>
                        ` : ''}
                        
                        <button class="action-btn btn-edit" onclick="adminPanel.openCampaignModal(${campaign.id})" style="width: 100%;">
                            <i class="fas fa-edit"></i> Editar Completo
                        </button>
                        
                        ${campaign.status === 'approved' ? `
                            <button class="action-btn btn-reject" onclick="adminPanel.changeStatus(${campaign.id}, 'rejected')" style="width: 100%;">
                                <i class="fas fa-pause"></i> Desativar
                            </button>
                        ` : ''}
                        
                        ${campaign.status === 'rejected' ? `
                            <button class="action-btn btn-approve" onclick="adminPanel.changeStatus(${campaign.id}, 'pending')" style="width: 100%;">
                                <i class="fas fa-undo"></i> Reativar
                            </button>
                        ` : ''}
                        
                        <button class="action-btn btn-edit" onclick="adminPanel.viewCampaignDetails(${campaign.id})" style="width: 100%; background: #6366f1;">
                            <i class="fas fa-eye"></i> Ver Detalhes
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        // Contadores de categoria removidos
    }

    approveCampaign(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (campaign) {
            campaign.status = 'approved';
            campaign.approvedAt = new Date().toISOString();
            delete campaign.rejectedAt;
            delete campaign.rejectionReason;
            
            this.saveCampaigns();
            this.loadCampaigns();
            this.updateStats();
            
            this.showNotification('Campanha aprovada e publicada no site!', 'success');
            this.logAction(`Campaign approved - ID: ${id}`);
            this.syncWithMainSite();
        }
    }

    rejectCampaign(id) {
        if (confirm('Tem certeza que deseja rejeitar esta campanha?')) {
            const campaign = this.campaigns.find(c => c.id === id);
            if (campaign) {
                campaign.status = 'rejected';
                this.saveCampaigns();
                this.loadCampaigns();
                this.updateStats();
                this.showNotification('Campanha rejeitada', 'warning');
                this.logAction(`Campaign rejected - ID: ${id}`);
            }
        }
    }

    deactivateCampaign(id) {
        if (confirm('Tem certeza que deseja desativar esta campanha?')) {
            const campaign = this.campaigns.find(c => c.id === id);
            if (campaign) {
                campaign.status = 'rejected';
                this.saveCampaigns();
                this.loadCampaigns();
                this.updateStats();
                this.showNotification('Campanha desativada', 'info');
                this.logAction(`Campaign deactivated - ID: ${id}`);
            }
        }
    }

    editCampaign(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (campaign) {
            // Aqui você pode abrir um modal de edição
            const newTitle = prompt('Novo título da campanha:', campaign.title);
            if (newTitle && newTitle !== campaign.title) {
                campaign.title = newTitle;
                this.saveCampaigns();
                this.loadCampaigns();
                this.showNotification('Campanha atualizada!', 'success');
                this.logAction(`Campaign edited - ID: ${id}`);
            }
        }
    }

    saveCampaigns() {
        localStorage.setItem('adminCampaigns', JSON.stringify(this.campaigns));
        
        // Trigger evento para notificar outras abas
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'adminCampaigns',
            newValue: JSON.stringify(this.campaigns)
        }));
        
        this.syncWithMainSite();
    }

    syncWithMainSite() {
        // Força sincronização com o site principal
        console.log('🔄 Sincronizando mudanças com o site principal...');
        
        // Criar evento customizado para sincronização
        const syncEvent = new CustomEvent('adminSync', {
            detail: {
                campaigns: this.campaigns,
                settings: JSON.parse(localStorage.getItem('siteSettings') || '{}'),
                timestamp: new Date().toISOString()
            }
        });
        
        window.dispatchEvent(syncEvent);
        
        // Forçar sincronização imediata
        this.forceImmediateSync();
    }

    /**
     * Força sincronização imediata em todas as abas
     */
    forceImmediateSync() {
        // Usar BroadcastChannel para comunicação entre abas
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('hemobyte-sync');
            channel.postMessage({
                type: 'FORCE_SYNC',
                campaigns: this.campaigns,
                timestamp: Date.now()
            });
            channel.close();
        }

        // Método alternativo usando localStorage com timestamp
        const syncData = {
            campaigns: this.campaigns,
            timestamp: Date.now(),
            forceSync: true
        };
        
        localStorage.setItem('hemobyte_force_sync', JSON.stringify(syncData));
        
        // Remover após 1 segundo para evitar acúmulo
        setTimeout(() => {
            localStorage.removeItem('hemobyte_force_sync');
        }, 1000);

        console.log('⚡ Sincronização forçada disparada para todas as abas');
    }

    /**
     * Edita uma estatística específica
     */
    editStat(statType) {
        const statNames = {
            'donations': 'Doações Realizadas',
            'users': 'Usuários Cadastrados', 
            'hospitals': 'Hospitais Atendidos'
        };

        const currentValue = this.stats[`total${statType.charAt(0).toUpperCase() + statType.slice(1)}`] || 0;
        
        const newValue = prompt(`Editar ${statNames[statType]}:\n\nValor atual: ${currentValue}`, currentValue);
        
        if (newValue !== null && !isNaN(newValue) && newValue.trim() !== '') {
            const numValue = parseInt(newValue);
            
            // Atualizar no objeto stats
            this.stats[`total${statType.charAt(0).toUpperCase() + statType.slice(1)}`] = numValue;
            
            // Salvar no localStorage
            localStorage.setItem('hemobyte_stats', JSON.stringify(this.stats));
            
            // Atualizar interface do admin
            const elementId = statType === 'donations' ? 'total-donations' : 
                             statType === 'users' ? 'total-users' : 'total-hospitals';
            document.getElementById(elementId).textContent = numValue.toLocaleString();
            
            // Sincronizar com o site principal
            this.syncWithMainSite();
            
            this.showNotification(`${statNames[statType]} atualizada para ${numValue}!`, 'success');
            this.logAction(`Statistic updated - ${statType}: ${currentValue} -> ${numValue}`);
            
            console.log(`📊 Estatística ${statType} atualizada:`, { anterior: currentValue, nova: numValue });
        }
    }

    updateDashboardStats() {
        // Atualizar estatísticas no dashboard baseadas nos valores do painel
        const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
        
        if (settings.totalDonations) {
            document.getElementById('total-donations').textContent = settings.totalDonations;
        }
        if (settings.activeCampaigns) {
            document.getElementById('total-campaigns').textContent = settings.activeCampaigns;
        }
        if (settings.livesImpacted) {
            // Não há elemento específico no dashboard, mas pode ser adicionado
        }
    }

    // ==========================================
    // GERENCIAMENTO DE IMAGENS
    // ==========================================

    setupImageUpload() {
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('image-input');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleImageUpload(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files);
        });
    }

    handleImageUpload(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        url: e.target.result,
                        uploadDate: new Date().toISOString(),
                        size: file.size
                    };
                    
                    this.images.push(imageData);
                    this.saveImages();
                    this.loadImages();
                    this.showNotification(`Imagem "${file.name}" enviada com sucesso!`, 'success');
                    this.logAction(`Image uploaded - ${file.name}`);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    loadImages() {
        const gallery = document.getElementById('image-gallery');
        
        // Limpa apenas as imagens dinâmicas, mantém as de exemplo
        const dynamicImages = gallery.querySelectorAll('.dynamic-image');
        dynamicImages.forEach(img => img.remove());

        this.images.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item dynamic-image';
            
            imageItem.innerHTML = `
                <img src="${image.url}" alt="${image.name}">
                <div class="image-overlay">
                    <div class="image-actions">
                        <button class="action-btn btn-edit" onclick="adminPanel.editImage('${image.id}')" aria-label="Editar imagem">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-reject" onclick="adminPanel.deleteImage('${image.id}')" aria-label="Excluir imagem">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            gallery.appendChild(imageItem);
        });
    }

    editImage(id) {
        const image = this.images.find(img => img.id == id);
        if (image) {
            const newName = prompt('Novo nome da imagem:', image.name);
            if (newName && newName !== image.name) {
                image.name = newName;
                this.saveImages();
                this.loadImages();
                this.showNotification('Imagem renomeada!', 'success');
                this.logAction(`Image renamed - ${newName}`);
            }
        }
    }

    deleteImage(id) {
        if (confirm('Tem certeza que deseja excluir esta imagem?')) {
            this.images = this.images.filter(img => img.id != id);
            this.saveImages();
            this.loadImages();
            this.showNotification('Imagem excluída', 'info');
            this.logAction(`Image deleted - ID: ${id}`);
        }
    }

    saveImages() {
        localStorage.setItem('adminImages', JSON.stringify(this.images));
    }

    // ==========================================
    // CONTROLE DO SITE
    // ==========================================

    setupSiteControls() {
        // Carrega configurações salvas
        const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
        
        if (settings.siteTitle) {
            document.getElementById('site-title').value = settings.siteTitle;
        }
        if (settings.siteDescription) {
            document.getElementById('site-description').value = settings.siteDescription;
        }
        if (settings.emergencyMessage) {
            document.getElementById('emergency-message').value = settings.emergencyMessage;
        }
        
        document.getElementById('maintenance-mode').checked = settings.maintenanceMode || false;
        document.getElementById('emergency-alert').checked = settings.emergencyAlert !== false;
    }

    saveSettings() {
        const settings = {
            siteTitle: document.getElementById('site-title').value,
            siteDescription: document.getElementById('site-description').value,
            emergencyMessage: document.getElementById('emergency-message').value,
            maintenanceMode: document.getElementById('maintenance-mode').checked,
            emergencyAlert: document.getElementById('emergency-alert').checked,
            totalDonations: document.getElementById('total-donations-input').value,
            activeCampaigns: document.getElementById('active-campaigns-input').value,
            livesImpacted: document.getElementById('lives-impacted-input').value,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('siteSettings', JSON.stringify(settings));
        localStorage.setItem('lastAdminUpdate', new Date().toISOString());
        
        // Trigger evento para notificar outras abas
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'siteSettings',
            newValue: JSON.stringify(settings)
        }));
        
        this.showNotification('Configurações salvas e aplicadas ao site!', 'success');
        this.logAction('Site settings updated and synced');
        
        // Atualizar estatísticas no dashboard
        this.updateDashboardStats();
        
        // Forçar sincronização
        this.syncWithMainSite();
    }

    backupData() {
        const data = {
            campaigns: this.campaigns,
            users: this.users,
            images: this.images.map(img => ({...img, url: '[BASE64_DATA]'})), // Remove dados base64 do backup
            settings: JSON.parse(localStorage.getItem('siteSettings') || '{}'),
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hemobyte-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Backup realizado com sucesso!', 'success');
        this.logAction('Data backup created');
    }

    clearCache() {
        if (confirm('Tem certeza que deseja limpar o cache? Esta ação não pode ser desfeita.')) {
            // Mantém apenas dados essenciais
            const adminSession = localStorage.getItem('adminSession');
            localStorage.clear();
            if (adminSession) {
                localStorage.setItem('adminSession', adminSession);
            }
            
            this.showNotification('Cache limpo com sucesso!', 'success');
            this.logAction('Cache cleared');
            
            // Recarrega a página após 2 segundos
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    // ==========================================
    // GERENCIAMENTO DE USUÁRIOS
    // ==========================================

    async loadUsers() {
        // Tentar carregar usuários do banco de dados via API
        try {
            const response = await fetch('admin-api.php?action=users', {
                headers: {
                    'Authorization': 'Bearer admin_token_8080'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.users = data.users;
                    this.displayUsers();
                    console.log('✅ Usuários carregados do banco de dados:', this.users.length);
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar usuários do banco, usando dados locais:', error);
        }
        
        // Fallback: usar dados locais se API falhar
        this.displayUsers();
    }

    displayUsers() {
        const tbody = document.querySelector('#users tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Ordenar usuários por data de cadastro (mais recentes primeiro)
        const sortedUsers = [...this.users].sort((a, b) => {
            const dateA = new Date(a.created_at || a.registrationDate);
            const dateB = new Date(b.created_at || b.registrationDate);
            return dateB - dateA;
        });

        sortedUsers.forEach(user => {
            const row = document.createElement('tr');
            
            const statusClass = {
                'ativo': 'status-approved',
                'active': 'status-approved',
                'bloqueado': 'status-rejected',
                'blocked': 'status-rejected',
                'pendente': 'status-pending'
            }[user.status] || 'status-pending';

            const statusText = {
                'ativo': 'Ativo',
                'active': 'Ativo',
                'bloqueado': 'Bloqueado',
                'blocked': 'Bloqueado',
                'pendente': 'Pendente'
            }[user.status] || 'Pendente';

            row.innerHTML = `
                <td>${user.nome || user.name}</td>
                <td>${user.email}</td>
                <td>${this.formatDate(user.created_at || user.registrationDate)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="adminPanel.editUser(${user.id})">Editar</button>
                    <button class="action-btn btn-reject" onclick="adminPanel.blockUser(${user.id})">Bloquear</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        // Contadores de categoria removidos
    }

    editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            const newName = prompt('Novo nome do usuário:', user.name);
            if (newName && newName !== user.name) {
                user.name = newName;
                this.saveUsers();
                this.showNotification('Usuário atualizado!', 'success');
                this.logAction(`User edited - ID: ${id}`);
            }
        }
    }

    blockUser(id) {
        if (confirm('Tem certeza que deseja bloquear este usuário?')) {
            const user = this.users.find(u => u.id === id);
            if (user) {
                user.status = 'blocked';
                this.saveUsers();
                this.showNotification('Usuário bloqueado', 'warning');
                this.logAction(`User blocked - ID: ${id}`);
            }
        }
    }

    saveUsers() {
        localStorage.setItem('adminUsers', JSON.stringify(this.users));
    }

    // ==========================================
    // LOGS DO SISTEMA
    // ==========================================

    loadLogs() {
        // Os logs já estão no HTML - implementação básica
        console.log('Logs section loaded');
    }

    logAction(action) {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        logs.unshift({
            timestamp: new Date().toISOString(),
            action: action,
            user: 'adm'
        });
        
        // Mantém apenas os últimos 100 logs
        if (logs.length > 100) {
            logs.splice(100);
        }
        
        localStorage.setItem('systemLogs', JSON.stringify(logs));
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // ==========================================
    // NOVAS FUNCIONALIDADES DE CAMPANHAS
    // ==========================================

    changeStatus(id, newStatus) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (!campaign) return;

        const statusNames = {
            'pending': 'Pendente',
            'approved': 'Aprovada', 
            'rejected': 'Rejeitada'
        };

        if (confirm(`Tem certeza que deseja alterar o status para "${statusNames[newStatus]}"?`)) {
            const oldStatus = campaign.status;
            campaign.status = newStatus;
            
            // Adicionar timestamps
            if (newStatus === 'approved') {
                campaign.approvedAt = new Date().toISOString();
                delete campaign.rejectedAt;
                delete campaign.rejectionReason;
            } else if (newStatus === 'rejected') {
                campaign.rejectedAt = new Date().toISOString();
                delete campaign.approvedAt;
            } else if (newStatus === 'pending') {
                delete campaign.approvedAt;
                delete campaign.rejectedAt;
                delete campaign.rejectionReason;
            }

            this.saveCampaigns();
            this.loadCampaigns();
            this.updateStats();
            
            this.showNotification(`Status alterado de "${statusNames[oldStatus]}" para "${statusNames[newStatus]}"!`, 'success');
            this.logAction(`Campaign status changed - ID: ${id}, ${oldStatus} -> ${newStatus}`);
            this.syncWithMainSite();
        }
    }

    openCampaignModal(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (!campaign) return;

        // Criar modal de edição
        const modal = document.createElement('div');
        modal.className = 'campaign-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 2rem;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Editar Campanha</h2>
                    <button onclick="this.closest('.campaign-modal').remove()" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #666;
                    ">&times;</button>
                </div>

                <form id="edit-campaign-form">
                    <div class="form-group">
                        <label>Título da Campanha</label>
                        <input type="text" id="edit-title" value="${campaign.title}" required>
                    </div>

                    <div class="form-group">
                        <label>Organizador</label>
                        <input type="text" id="edit-organizer" value="${campaign.organizer}" required>
                    </div>

                    <div class="form-group">
                        <label>Email do Organizador</label>
                        <input type="email" id="edit-organizer-email" value="${campaign.organizerEmail}" required>
                    </div>

                    <div class="form-group">
                        <label>Telefone do Organizador</label>
                        <input type="tel" id="edit-organizer-phone" value="${campaign.organizerPhone}" required>
                    </div>

                    <div class="form-group">
                        <label>Local da Campanha</label>
                        <input type="text" id="edit-location" value="${campaign.location}" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Data</label>
                            <input type="date" id="edit-date" value="${campaign.date}" required>
                        </div>

                        <div class="form-group">
                            <label>Horário</label>
                            <input type="text" id="edit-time" value="${campaign.time}" placeholder="08:00 - 17:00" required>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Tipo Sanguíneo</label>
                            <select id="edit-blood-type" required>
                                <option value="A+" ${campaign.bloodType === 'A+' ? 'selected' : ''}>A+</option>
                                <option value="A-" ${campaign.bloodType === 'A-' ? 'selected' : ''}>A-</option>
                                <option value="B+" ${campaign.bloodType === 'B+' ? 'selected' : ''}>B+</option>
                                <option value="B-" ${campaign.bloodType === 'B-' ? 'selected' : ''}>B-</option>
                                <option value="AB+" ${campaign.bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                                <option value="AB-" ${campaign.bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
                                <option value="O+" ${campaign.bloodType === 'O+' ? 'selected' : ''}>O+</option>
                                <option value="O-" ${campaign.bloodType === 'O-' ? 'selected' : ''}>O-</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Meta de Doadores</label>
                            <input type="number" id="edit-goal" value="${campaign.goal}" min="1" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Doadores Atuais</label>
                        <input type="number" id="edit-current" value="${campaign.current || 0}" min="0">
                    </div>

                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea id="edit-description" rows="4" required>${campaign.description}</textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Status</label>
                            <select id="edit-status" required>
                                <option value="pending" ${campaign.status === 'pending' ? 'selected' : ''}>Pendente</option>
                                <option value="approved" ${campaign.status === 'approved' ? 'selected' : ''}>Aprovada</option>
                                <option value="rejected" ${campaign.status === 'rejected' ? 'selected' : ''}>Rejeitada</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Categoria</label>
                            <select id="edit-category" required>
                                <option value="urgente" ${campaign.category === 'urgente' ? 'selected' : ''}>🚨 Urgente</option>
                                <option value="ativa" ${campaign.category === 'ativa' ? 'selected' : ''}>✅ Ativa</option>
                                <option value="planejamento" ${campaign.category === 'planejamento' ? 'selected' : ''}>📋 Planejamento</option>
                            </select>
                        </div>
                    </div>

                    ${campaign.status === 'rejected' ? `
                        <div class="form-group">
                            <label>Motivo da Rejeição</label>
                            <textarea id="edit-rejection-reason" rows="2">${campaign.rejectionReason || ''}</textarea>
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="action-btn btn-approve" style="flex: 1;">
                            <i class="fas fa-save"></i> Salvar Alterações
                        </button>
                        <button type="button" onclick="this.closest('.campaign-modal').remove()" class="action-btn btn-reject" style="flex: 1;">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Adicionar event listener para o formulário
        document.getElementById('edit-campaign-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCampaignChanges(id, modal);
        });

        // Adicionar listener para mudança de status
        document.getElementById('edit-status').addEventListener('change', (e) => {
            const rejectionReasonDiv = modal.querySelector('#edit-rejection-reason')?.closest('.form-group');
            if (e.target.value === 'rejected') {
                if (!rejectionReasonDiv) {
                    const newDiv = document.createElement('div');
                    newDiv.className = 'form-group';
                    newDiv.innerHTML = `
                        <label>Motivo da Rejeição</label>
                        <textarea id="edit-rejection-reason" rows="2" placeholder="Digite o motivo da rejeição..."></textarea>
                    `;
                    e.target.closest('.form-group').insertAdjacentElement('afterend', newDiv);
                }
            } else if (rejectionReasonDiv) {
                rejectionReasonDiv.remove();
            }
        });
    }

    saveCampaignChanges(id, modal) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (!campaign) return;

        // Capturar dados do formulário
        const formData = {
            title: document.getElementById('edit-title').value,
            organizer: document.getElementById('edit-organizer').value,
            organizerEmail: document.getElementById('edit-organizer-email').value,
            organizerPhone: document.getElementById('edit-organizer-phone').value,
            location: document.getElementById('edit-location').value,
            date: document.getElementById('edit-date').value,
            time: document.getElementById('edit-time').value,
            bloodType: document.getElementById('edit-blood-type').value,
            goal: parseInt(document.getElementById('edit-goal').value),
            current: parseInt(document.getElementById('edit-current').value),
            description: document.getElementById('edit-description').value,
            status: document.getElementById('edit-status').value,
            category: document.getElementById('edit-category').value
        };

        // Capturar motivo de rejeição se existir
        const rejectionReasonField = document.getElementById('edit-rejection-reason');
        if (rejectionReasonField) {
            formData.rejectionReason = rejectionReasonField.value;
        }

        // Atualizar campanha
        const oldStatus = campaign.status;
        Object.assign(campaign, formData);

        // Atualizar timestamps baseado no status
        if (formData.status === 'approved' && oldStatus !== 'approved') {
            campaign.approvedAt = new Date().toISOString();
            delete campaign.rejectedAt;
        } else if (formData.status === 'rejected' && oldStatus !== 'rejected') {
            campaign.rejectedAt = new Date().toISOString();
            delete campaign.approvedAt;
        } else if (formData.status === 'pending') {
            delete campaign.approvedAt;
            delete campaign.rejectedAt;
            delete campaign.rejectionReason;
        }

        this.saveCampaigns();
        this.loadCampaigns();
        this.updateStats();
        
        modal.remove();
        this.showNotification('Campanha atualizada com sucesso!', 'success');
        this.logAction(`Campaign fully edited - ID: ${id}`);
    }

    viewCampaignDetails(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (!campaign) return;

        // Criar modal de detalhes
        const modal = document.createElement('div');
        modal.className = 'campaign-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        const progress = campaign.goal ? Math.round((campaign.current / campaign.goal) * 100) : 0;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 2rem;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Detalhes da Campanha</h2>
                    <button onclick="this.closest('.campaign-modal').remove()" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #666;
                    ">&times;</button>
                </div>

                <div style="space-y: 1rem;">
                    <div style="margin-bottom: 1rem;">
                        <h3 style="color: #e60000; margin-bottom: 0.5rem;">${campaign.title}</h3>
                        <p style="color: #666; font-size: 0.9rem;">${campaign.description}</p>
                    </div>

                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">📍 Informações do Evento</h4>
                        <p><strong>Local:</strong> ${campaign.location}</p>
                        <p><strong>Data:</strong> ${this.formatDate(campaign.date)}</p>
                        <p><strong>Horário:</strong> ${campaign.time}</p>
                        <p><strong>Tipo Sanguíneo:</strong> ${campaign.bloodType}</p>
                    </div>

                    <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">👤 Organizador</h4>
                        <p><strong>Nome:</strong> ${campaign.organizer}</p>
                        <p><strong>Email:</strong> ${campaign.organizerEmail}</p>
                        <p><strong>Telefone:</strong> ${campaign.organizerPhone}</p>
                    </div>

                    <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">📊 Progresso</h4>
                        <p><strong>Meta:</strong> ${campaign.goal} doadores</p>
                        <p><strong>Atual:</strong> ${campaign.current || 0} doadores</p>
                        <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin: 0.5rem 0;">
                            <div style="background: #10b981; height: 100%; width: ${progress}%; border-radius: 4px;"></div>
                        </div>
                        <p style="font-size: 0.9rem; color: #666;">${progress}% da meta atingida</p>
                    </div>

                    <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">📅 Histórico</h4>
                        <p><strong>Criada em:</strong> ${this.formatDateTime(campaign.createdAt)}</p>
                        ${campaign.approvedAt ? `<p style="color: #10b981;"><strong>Aprovada em:</strong> ${this.formatDateTime(campaign.approvedAt)}</p>` : ''}
                        ${campaign.rejectedAt ? `<p style="color: #ef4444;"><strong>Rejeitada em:</strong> ${this.formatDateTime(campaign.rejectedAt)}</p>` : ''}
                        ${campaign.rejectionReason ? `<p style="color: #ef4444;"><strong>Motivo:</strong> ${campaign.rejectionReason}</p>` : ''}
                    </div>

                    <button onclick="this.closest('.campaign-modal').remove()" class="action-btn btn-edit" style="width: 100%;">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // ==========================================
    // SISTEMA DE CATEGORIAS
    // ==========================================

    updateCategoryStats() {
        const stats = {
            urgente: this.campaigns.filter(c => c.category === 'urgente').length,
            ativa: this.campaigns.filter(c => c.category === 'ativa').length,
            planejamento: this.campaigns.filter(c => c.category === 'planejamento').length
        };

        // Atualizar contadores na interface
        const urgenteCount = document.getElementById('urgente-count');
        const ativaCount = document.getElementById('ativa-count');
        const planejamentoCount = document.getElementById('planejamento-count');

        if (urgenteCount) urgenteCount.textContent = stats.urgente;
        if (ativaCount) ativaCount.textContent = stats.ativa;
        if (planejamentoCount) planejamentoCount.textContent = stats.planejamento;
    }

    filterCampaigns() {
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';
        const statusFilter = document.getElementById('status-filter')?.value || 'all';
        
        // Filtrar campanhas
        let filteredCampaigns = [...this.campaigns];

        if (categoryFilter !== 'all') {
            filteredCampaigns = filteredCampaigns.filter(c => c.category === categoryFilter);
        }

        if (statusFilter !== 'all') {
            filteredCampaigns = filteredCampaigns.filter(c => c.status === statusFilter);
        }

        // Recarregar campanhas filtradas
        this.displayFilteredCampaigns(filteredCampaigns);
    }

    displayFilteredCampaigns(campaigns) {
        const tbody = document.getElementById('campaigns-tbody');
        if (!tbody) return;

        // Ordenar campanhas filtradas
        const sortedCampaigns = campaigns.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (b.status === 'pending' && a.status !== 'pending') return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Limpar tabela
        tbody.innerHTML = '';

        // Mostrar campanhas filtradas
        sortedCampaigns.forEach(campaign => {
            const row = document.createElement('tr');
            
            const statusClass = {
                'pending': 'status-pending',
                'approved': 'status-approved',
                'rejected': 'status-rejected'
            }[campaign.status];

            const statusText = {
                'pending': 'Pendente',
                'approved': 'Aprovada',
                'rejected': 'Rejeitada'
            }[campaign.status];

            // Adicionar classe para destacar campanhas pendentes
            if (campaign.status === 'pending') {
                row.style.backgroundColor = '#fef3c7';
            } else if (campaign.status === 'rejected') {
                row.style.backgroundColor = '#fee2e2';
            }

            const categoryInfo = {
                'urgente': { icon: '🚨', text: 'Urgente', color: '#ef4444', bg: '#fee2e2' },
                'ativa': { icon: '✅', text: 'Ativa', color: '#10b981', bg: '#d1fae5' },
                'planejamento': { icon: '📋', text: 'Planejamento', color: '#3b82f6', bg: '#dbeafe' }
            }[campaign.category] || { icon: '✅', text: 'Ativa', color: '#10b981', bg: '#d1fae5' };

            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${campaign.title}</div>
                    <div style="font-size: 0.8rem; color: #666;">
                        Organizado por: ${campaign.organizer}<br>
                        Tipo: ${campaign.bloodType} | Meta: ${campaign.goal} doadores
                    </div>
                </td>
                <td>
                    <div>${campaign.location}</div>
                    <div style="font-size: 0.8rem; color: #666;">
                        ${this.formatDate(campaign.date)} - ${campaign.time}
                    </div>
                </td>
                <td>
                    <div style="
                        display: inline-block;
                        padding: 0.5rem 0.75rem;
                        background: ${categoryInfo.bg};
                        color: ${categoryInfo.color};
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        border: 2px solid ${categoryInfo.color};
                    ">
                        ${categoryInfo.icon} ${categoryInfo.text}
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <button onclick="adminPanel.changeCampaignCategory(${campaign.id})" style="
                            background: none;
                            border: 1px solid #d1d5db;
                            color: #6b7280;
                            padding: 0.25rem 0.5rem;
                            border-radius: 4px;
                            font-size: 0.7rem;
                            cursor: pointer;
                        ">
                            <i class="fas fa-edit"></i> Alterar
                        </button>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.8rem; color: #666;">
                        Criada: ${this.formatDateTime(campaign.createdAt)}
                    </div>
                    ${campaign.approvedAt ? `<div style="font-size: 0.8rem; color: #10b981;">Aprovada: ${this.formatDateTime(campaign.approvedAt)}</div>` : ''}
                    ${campaign.rejectedAt ? `<div style="font-size: 0.8rem; color: #ef4444;">Rejeitada: ${this.formatDateTime(campaign.rejectedAt)}</div>` : ''}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${campaign.status === 'rejected' && campaign.rejectionReason ? `
                        <div style="font-size: 0.7rem; color: #ef4444; margin-top: 0.25rem;">
                            ${campaign.rejectionReason}
                        </div>
                    ` : ''}
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        ${campaign.status === 'pending' ? `
                            <button class="action-btn btn-approve" onclick="adminPanel.approveCampaign(${campaign.id})" style="width: 100%;">
                                <i class="fas fa-check"></i> Aprovar
                            </button>
                            <button class="action-btn btn-reject" onclick="adminPanel.rejectCampaign(${campaign.id})" style="width: 100%;">
                                <i class="fas fa-times"></i> Rejeitar
                            </button>
                        ` : ''}
                        
                        <button class="action-btn btn-edit" onclick="adminPanel.openCampaignModal(${campaign.id})" style="width: 100%;">
                            <i class="fas fa-edit"></i> Editar Completo
                        </button>
                        
                        ${campaign.status === 'approved' ? `
                            <button class="action-btn btn-reject" onclick="adminPanel.changeStatus(${campaign.id}, 'rejected')" style="width: 100%;">
                                <i class="fas fa-pause"></i> Desativar
                            </button>
                        ` : ''}
                        
                        ${campaign.status === 'rejected' ? `
                            <button class="action-btn btn-approve" onclick="adminPanel.changeStatus(${campaign.id}, 'pending')" style="width: 100%;">
                                <i class="fas fa-undo"></i> Reativar
                            </button>
                        ` : ''}
                        
                        <button class="action-btn btn-edit" onclick="adminPanel.viewCampaignDetails(${campaign.id})" style="width: 100%; background: #6366f1;">
                            <i class="fas fa-eye"></i> Ver Detalhes
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        // Mostrar mensagem se não houver resultados
        if (campaigns.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhuma campanha encontrada com os filtros selecionados.
                    </td>
                </tr>
            `;
        }
    }

    changeCampaignCategory(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (!campaign) return;

        // Criar modal para mudança de categoria
        const modal = document.createElement('div');
        modal.className = 'category-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 2rem;
                max-width: 400px;
                width: 100%;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Alterar Categoria</h3>
                    <button onclick="this.closest('.category-modal').remove()" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #666;
                    ">&times;</button>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <strong>Campanha:</strong> ${campaign.title}
                </div>

                <div style="margin-bottom: 2rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Nova Categoria:</label>
                    <select id="new-category" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 1rem;
                    ">
                        <option value="urgente" ${campaign.category === 'urgente' ? 'selected' : ''}>🚨 Urgente</option>
                        <option value="ativa" ${campaign.category === 'ativa' ? 'selected' : ''}>✅ Ativa</option>
                        <option value="planejamento" ${campaign.category === 'planejamento' ? 'selected' : ''}>📋 Planejamento</option>
                    </select>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button onclick="adminPanel.saveCategoryChange(${id})" class="action-btn btn-approve" style="flex: 1;">
                        <i class="fas fa-save"></i> Salvar
                    </button>
                    <button onclick="this.closest('.category-modal').remove()" class="action-btn btn-reject" style="flex: 1;">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    saveCategoryChange(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        const newCategory = document.getElementById('new-category').value;
        
        if (campaign && newCategory) {
            const oldCategory = campaign.category;
            campaign.category = newCategory;
            
            this.saveCampaigns();
            this.loadCampaigns();
            this.updateStats();
            
            document.querySelector('.category-modal').remove();
            
            const categoryNames = {
                'urgente': 'Urgente',
                'ativa': 'Ativa',
                'planejamento': 'Planejamento'
            };
            
            this.showNotification(`Categoria alterada de "${categoryNames[oldCategory]}" para "${categoryNames[newCategory]}"!`, 'success');
            this.logAction(`Campaign category changed - ID: ${id}, ${oldCategory} -> ${newCategory}`);
            this.syncWithMainSite();
        }
    }

    showNotification(message, type = 'info') {
        // Cria notificação temporária
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    setupSyncIndicator() {
        const syncIndicator = document.getElementById('sync-status');
        if (syncIndicator) {
            // Atualizar indicador a cada 5 segundos
            setInterval(() => {
                this.updateSyncStatus();
            }, 5000);
            
            // Clique no indicador força sincronização
            syncIndicator.addEventListener('click', () => {
                this.forceSyncWithSite();
            });
        }
    }

    updateSyncStatus() {
        const syncIndicator = document.getElementById('sync-status');
        if (!syncIndicator) return;

        const icon = syncIndicator.querySelector('i');
        const text = syncIndicator.querySelector('span');
        
        // Verificar se há mudanças pendentes
        const lastUpdate = localStorage.getItem('lastAdminUpdate');
        const lastSync = localStorage.getItem('lastSiteSync');
        
        if (!lastSync || (lastUpdate && new Date(lastUpdate) > new Date(lastSync))) {
            // Há mudanças pendentes
            syncIndicator.className = 'sync-indicator syncing';
            icon.className = 'fas fa-sync-alt';
            text.textContent = 'Sincronizando...';
        } else {
            // Sincronizado
            syncIndicator.className = 'sync-indicator';
            icon.className = 'fas fa-check-circle';
            text.textContent = 'Sincronizado';
        }
    }

    forceSyncWithSite() {
        const syncIndicator = document.getElementById('sync-status');
        if (syncIndicator) {
            const icon = syncIndicator.querySelector('i');
            const text = syncIndicator.querySelector('span');
            
            syncIndicator.className = 'sync-indicator syncing';
            icon.className = 'fas fa-sync-alt';
            text.textContent = 'Forçando sync...';
        }
        
        // Atualizar timestamp de sincronização
        localStorage.setItem('lastSiteSync', new Date().toISOString());
        
        // Trigger eventos de sincronização
        this.syncWithMainSite();
        
        setTimeout(() => {
            this.updateSyncStatus();
            this.showNotification('Sincronização forçada com o site principal!', 'success');
        }, 1000);
    }

    logout() {
        if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
            localStorage.removeItem('adminSession');
            this.logAction('Admin logout');
            window.location.href = 'admin-login.html';
        }
    }
}

// Funções globais para os botões (necessárias para onclick)
window.approveCampaign = (id) => adminPanel.approveCampaign(id);
window.rejectCampaign = (id) => adminPanel.rejectCampaign(id);
window.editCampaign = (id) => adminPanel.editCampaign(id);
window.editImage = (id) => adminPanel.editImage(id);
window.deleteImage = (id) => adminPanel.deleteImage(id);
window.editUser = (id) => adminPanel.editUser(id);
window.blockUser = (id) => adminPanel.blockUser(id);
window.loadCampaigns = () => adminPanel.loadCampaigns();
window.saveSettings = () => adminPanel.saveSettings();
window.backupData = () => adminPanel.backupData();
window.clearCache = () => adminPanel.clearCache();

// Novas funções globais
window.changeStatus = (id, status) => adminPanel.changeStatus(id, status);
window.openCampaignModal = (id) => adminPanel.openCampaignModal(id);
window.viewCampaignDetails = (id) => adminPanel.viewCampaignDetails(id);
window.changeCampaignCategory = (id) => adminPanel.changeCampaignCategory(id);
window.saveCategoryChange = (id) => adminPanel.saveCategoryChange(id);

// Inicializa o painel quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Função global para editar estatísticas
function editStat(statType) {
    if (window.adminPanel) {
        window.adminPanel.editStat(statType);
    }
}

// Adiciona estilos para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
