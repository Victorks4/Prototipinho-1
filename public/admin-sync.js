/**
 * Sistema de Sincronização Admin-Site - HemoByte
 * Sincroniza automaticamente as mudanças do painel administrativo com o site principal
 */

class AdminSync {
    constructor() {
        this.settings = {};
        this.campaigns = [];
        this.stats = {};
        this.syncInterval = 30000; // 30 segundos
        this.lastSync = null;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.loadCampaigns();
        this.loadStats();
        this.setupEventListeners();
        this.startAutoSync();
        
        // Remover seção de categorias se existir
        this.removeCategoryStatsSection();
        
        // Aplica configurações imediatamente
        this.applySettings();
        this.updateStats();
        this.updateCampaigns();
        this.updateEmergencyAlert();
        
        // Forçar sincronização completa após 1 segundo
        setTimeout(() => {
            this.forceSyncAll();
        }, 1000);
        
        console.log('🔄 Sistema de sincronização inicializado');
    }

    /**
     * Força sincronização completa de todas as campanhas
     */
    forceSyncAll() {
        console.log('🔄 Forçando sincronização completa...');
        
        // Recarregar dados do localStorage
        this.loadCampaigns();
        
        // Atualizar todas as campanhas
        this.updateCampaigns();
        
        // Se estivermos na página de campanhas ativas, atualizar também
        if (window.location.pathname.includes('campanhas-ativas.html')) {
            this.updateCampaignsPage();
        }
        
        console.log('✅ Sincronização completa finalizada');
    }

    /**
     * Remove seção de estatísticas por categoria
     */
    removeCategoryStatsSection() {
        const categorySection = document.querySelector('.category-stats-section');
        if (categorySection) {
            categorySection.remove();
            console.log('🗑️ Seção de categorias removida');
        }
    }

    /**
     * Configura listeners para sincronização em tempo real
     */
    setupEventListeners() {
        // Listener para mudanças no localStorage (vindas do painel admin)
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminCampaigns' || e.key === 'hemobyte_campaigns') {
                console.log('🔄 Campanhas atualizadas pelo admin - sincronizando...');
                this.loadCampaigns();
                this.updateCampaigns();
                this.updateStats();
                localStorage.setItem('lastSiteSync', new Date().toISOString());
            } else if (e.key === 'siteSettings') {
                console.log('🔄 Configurações atualizadas pelo admin - sincronizando...');
                this.loadSettings();
                this.applySettings();
                this.updateEmergencyAlert();
            } else if (e.key === 'hemobyte_stats') {
                console.log('📊 Estatísticas atualizadas pelo admin - sincronizando...');
                this.loadStats();
                this.updateStats();
                // Atualizar página principal se estivermos nela
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                    this.updateStatsBanner();
                    this.updateImpactSection();
                }
            } else if (e.key === 'hemobyte_force_sync') {
                console.log('⚡ Sincronização forçada detectada');
                const syncData = JSON.parse(e.newValue || '{}');
                if (syncData.campaigns) {
                    this.campaigns = syncData.campaigns;
                    this.updateCampaigns();
                    console.log('🔄 Campanhas atualizadas via sincronização forçada');
                }
            }
        });

        // Listener para eventos customizados do painel admin
        window.addEventListener('adminSync', (e) => {
            console.log('🔄 Sincronização forçada pelo admin:', e.detail);
            this.campaigns = e.detail.campaigns || this.campaigns;
            this.settings = e.detail.settings || this.settings;
            
            this.applySettings();
            this.updateStats();
            this.updateCampaigns();
            this.updateEmergencyAlert();
            
            localStorage.setItem('lastSiteSync', new Date().toISOString());
        });

        // Listener para BroadcastChannel (comunicação entre abas)
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('hemobyte-sync');
            channel.addEventListener('message', (e) => {
                if (e.data.type === 'FORCE_SYNC') {
                    console.log('📡 Sincronização via BroadcastChannel recebida');
                    this.campaigns = e.data.campaigns || [];
                    this.updateCampaigns();
                    console.log('🔄 Campanhas atualizadas via BroadcastChannel');
                }
            });
        }
    }

    /**
     * Carrega configurações do localStorage (vindas do painel admin)
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('siteSettings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
                console.log('🔄 Configurações carregadas do painel admin:', this.settings);
            }
        } catch (e) {
            console.warn('Erro ao carregar configurações:', e);
        }
    }

    /**
     * Carrega campanhas do localStorage (vindas do painel admin)
     */
    loadCampaigns() {
        try {
            const savedCampaigns = localStorage.getItem('adminCampaigns');
            if (savedCampaigns) {
                this.campaigns = JSON.parse(savedCampaigns);
                console.log('🔄 Campanhas carregadas do painel admin:', this.campaigns.length);
            }
        } catch (e) {
            console.warn('Erro ao carregar campanhas:', e);
        }
    }

    /**
     * Carrega estatísticas atualizadas
     */
    loadStats() {
        try {
            // Calcula estatísticas baseadas nas campanhas
            const approvedCampaigns = this.campaigns.filter(c => c.status === 'approved');
            const totalDonations = this.campaigns.reduce((sum, c) => sum + (c.current || 0), 0);
            
            this.stats = {
                totalCampaigns: approvedCampaigns.length,
                totalDonations: totalDonations,
                livesImpacted: Math.floor(totalDonations * 4), // Estimativa: 1 doação = 4 vidas
                activeCampaigns: approvedCampaigns.length
            };

            // Carregar estatísticas editáveis do admin
            const savedStats = localStorage.getItem('hemobyte_stats');
            if (savedStats) {
                const adminStats = JSON.parse(savedStats);
                this.stats.totalDonations = adminStats.totalDonations || this.stats.totalDonations;
                this.stats.totalUsers = adminStats.totalUsers || 2834;
                this.stats.totalHospitals = adminStats.totalHospitals || 15;
                this.stats.totalLives = adminStats.totalLives || 6000;
            } else {
                // Valores padrão para estatísticas editáveis
                this.stats.totalDonations = 1547;
                this.stats.totalUsers = 2834;
                this.stats.totalHospitals = 15;
                this.stats.totalLives = 6000;
            }
        } catch (e) {
            console.warn('Erro ao calcular estatísticas:', e);
        }
    }

    /**
     * Aplica configurações do painel admin ao site
     */
    applySettings() {
        // Atualizar título da página
        if (this.settings.siteTitle) {
            document.title = this.settings.siteTitle;
            
            // Atualizar logo text se existir
            const logoTexts = document.querySelectorAll('.logo-text');
            logoTexts.forEach(logo => {
                const siteName = this.settings.siteTitle.split(' - ')[0] || 'HemoByte';
                logo.textContent = siteName;
            });
        }

        // Atualizar meta description
        if (this.settings.siteDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = this.settings.siteDescription;
        }

        // Modo manutenção
        if (this.settings.maintenanceMode === true || this.settings.maintenanceMode === 'true') {
            this.showMaintenanceMode();
        }

        console.log('✅ Configurações aplicadas ao site');
    }

    /**
     * Atualiza estatísticas na página principal
     */
    updateStats() {
        // Atualizar números nas estatísticas
        const statElements = {
            'total-campaigns': this.stats.activeCampaigns,
            'total-donations': this.stats.totalDonations,
            'total-users': 2834, // Valor fixo ou pode ser sincronizado
            'lives-impacted': this.stats.livesImpacted
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, parseInt(element.textContent.replace(/\D/g, '')) || 0, value);
            }
        });

        // Atualizar estatísticas no banner principal
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach((element, index) => {
            const values = [this.stats.totalDonations, this.stats.activeCampaigns, this.stats.livesImpacted];
            if (values[index] !== undefined) {
                const currentValue = parseInt(element.textContent.replace(/\D/g, '')) || 0;
                this.animateNumber(element, currentValue, values[index]);
            }
        });

        // Atualizar números nos impact cards
        const impactNumbers = document.querySelectorAll('.impact-number');
        impactNumbers.forEach((element, index) => {
            const values = [this.stats.totalDonations, this.stats.activeCampaigns, this.stats.livesImpacted, 15]; // 15 hospitais fixo
            if (values[index] !== undefined) {
                const currentValue = parseInt(element.textContent.replace(/\D/g, '')) || 0;
                this.animateNumber(element, currentValue, values[index]);
            }
        });

        console.log('📊 Estatísticas atualizadas:', this.stats);
    }

    /**
     * Atualiza campanhas na página principal
     */
    updateCampaigns() {
        const approvedCampaigns = this.campaigns.filter(c => c.status === 'approved');
        
        console.log('🔄 Sincronizando campanhas com categorias:', approvedCampaigns.map(c => ({
            title: c.title,
            category: c.category,
            status: c.status
        })));
        
        // Atualizar página principal completa (index.html)
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
            this.updateMainPage(approvedCampaigns);
        }

        // Atualizar página de campanhas ativas se estivermos nela
        if (window.location.pathname.includes('campanhas-ativas.html')) {
            this.updateCampaignsPage();
        }

        console.log('🏕️ Campanhas atualizadas com categorias:', approvedCampaigns.length);
    }

    /**
     * Atualiza toda a página principal com dados do admin
     */
    updateMainPage(approvedCampaigns) {
        console.log('🏠 Atualizando página principal completa...');
        
        // 1. Atualizar estatísticas do banner superior
        this.updateStatsBanner();
        
        // 2. Atualizar alerta de emergência
        this.updateEmergencyAlert();
        
        // 3. Atualizar seção de impacto
        this.updateImpactSection();
        
        // 4. Atualizar campanhas em destaque
        this.updateFeaturedCampaigns(approvedCampaigns);
        
        console.log('✅ Página principal totalmente sincronizada');
    }

    /**
     * Atualiza estatísticas do banner superior
     */
    updateStatsBanner() {
        const approvedCampaigns = this.campaigns.filter(c => c.status === 'approved');
        const totalDonations = this.stats.totalDonations || 1500;
        const totalLives = this.stats.totalLives || 6000;
        const totalHospitals = this.stats.totalHospitals || 15;

        // Atualizar números do banner superior
        const statNumbers = document.querySelectorAll('.stats-banner .stat-number');
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = `${totalDonations}+`;
            statNumbers[0].setAttribute('aria-label', `${totalDonations} doações`);
            
            statNumbers[1].textContent = approvedCampaigns.length.toString();
            statNumbers[1].setAttribute('aria-label', `${approvedCampaigns.length} campanhas`);
            
            statNumbers[2].textContent = `${totalLives}+`;
            statNumbers[2].setAttribute('aria-label', `${totalLives} vidas impactadas`);
        }

        console.log('📊 Banner de estatísticas atualizado:', {
            doações: totalDonations,
            campanhas: approvedCampaigns.length,
            vidas: totalLives
        });
    }

    /**
     * Atualiza seção de impacto com dados do admin
     */
    updateImpactSection() {
        const approvedCampaigns = this.campaigns.filter(c => c.status === 'approved');
        const totalDonations = this.stats.totalDonations || 1500;
        const totalLives = this.stats.totalLives || 6000;
        const totalHospitals = this.stats.totalHospitals || 15;

        // Atualizar números da seção de impacto
        const impactNumbers = document.querySelectorAll('.impact-section .impact-number');
        if (impactNumbers.length >= 4) {
            impactNumbers[0].textContent = `${totalDonations}+`;
            impactNumbers[0].setAttribute('aria-label', `${totalDonations} doações`);
            
            impactNumbers[1].textContent = approvedCampaigns.length.toString();
            impactNumbers[1].setAttribute('aria-label', `${approvedCampaigns.length} campanhas`);
            
            impactNumbers[2].textContent = `${totalLives}+`;
            impactNumbers[2].setAttribute('aria-label', `${totalLives} vidas`);
            
            impactNumbers[3].textContent = totalHospitals.toString();
            impactNumbers[3].setAttribute('aria-label', `${totalHospitals} hospitais`);
        }

        console.log('💝 Seção de impacto atualizada:', {
            doações: totalDonations,
            campanhas: approvedCampaigns.length,
            vidas: totalLives,
            hospitais: totalHospitals
        });
    }

    /**
     * Atualiza campanhas em destaque na página principal
     * LÓGICA CORRIGIDA: Destaque = As melhores das campanhas que aparecem em "Campanhas Ativas"
     */
    updateFeaturedCampaigns(approvedCampaigns) {
        const campaignContainer = document.querySelector('.campaigns-container');
        if (!campaignContainer) return;

        // LÓGICA CORRIGIDA: Pegar 1 urgente + 1 ativa para variedade
        const urgentCampaigns = approvedCampaigns.filter(c => c.category === 'urgente' || c.bloodType === 'O-');
        const activeCampaigns = approvedCampaigns.filter(c => 
            c.category === 'ativa' || (c.category !== 'urgente' && c.bloodType !== 'O-' && c.category !== 'planejamento')
        );
        
        // Limpar container
        campaignContainer.innerHTML = '';

        // NOVA LÓGICA: 1 urgente + 1 ativa para ter variedade
        const featuredCampaigns = [];
        
        // Adicionar 1 urgente se houver
        if (urgentCampaigns.length > 0) {
            featuredCampaigns.push(urgentCampaigns[0]);
        }
        
        // Adicionar 1 ativa se houver
        if (activeCampaigns.length > 0) {
            featuredCampaigns.push(activeCampaigns[0]);
        }
        
        // Se não tiver 2, completar com outras aprovadas
        if (featuredCampaigns.length < 2) {
            const remaining = approvedCampaigns.filter(c => !featuredCampaigns.includes(c));
            featuredCampaigns.push(...remaining.slice(0, 2 - featuredCampaigns.length));
        }
        
        featuredCampaigns.forEach((campaign, index) => {
            const card = this.createFeaturedCampaignCard(campaign);
            campaignContainer.appendChild(card);
            
            const categoryLabel = campaign.category === 'urgente' || campaign.bloodType === 'O-' ? 'URGENTE' : 'ATIVA';
            console.log(`✅ Campanha ${index + 1} em destaque: ${campaign.title} (${categoryLabel})`);
        });

        // Se não houver campanhas suficientes, mostrar mensagem
        if (featuredCampaigns.length === 0) {
            campaignContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <p>Nenhuma campanha ativa no momento.</p>
                    <p>Novas campanhas aparecerão aqui após aprovação do administrador.</p>
                </div>
            `;
        }

        console.log(`🎯 LÓGICA CORRIGIDA: ${featuredCampaigns.length} campanhas em destaque`);
        console.log(`📊 Separação: ${urgentCampaigns.length} urgentes, ${activeCampaigns.length} ativas`);
        console.log(`✨ Em destaque:`, featuredCampaigns.map(c => `${c.title} (${c.category})`));
    }

    /**
     * Cria um card de campanha para a seção "em destaque" da página principal
     */
    createFeaturedCampaignCard(campaign) {
        const card = document.createElement('article');
        card.className = 'campaign-card';
        card.setAttribute('data-admin-sync', 'true');
        card.setAttribute('data-category', campaign.category || 'ativa');
        card.setAttribute('data-campaign-id', campaign.id);

        // Determinar status visual
        let statusClass = 'active';
        let statusText = 'Ativa';
        
        if (campaign.category === 'urgente' || campaign.bloodType === 'O-') {
            statusClass = 'urgent';
            statusText = 'Urgente';
        } else if (campaign.category === 'ativa') {
            statusClass = 'active';
            statusText = 'Ativa';
        } else if (campaign.category === 'planejamento') {
            statusClass = 'planning';
            statusText = 'Planejamento';
        }

        // Calcular progresso
        const progress = campaign.goal ? Math.round((campaign.current / campaign.goal) * 100) : 0;

        card.innerHTML = `
            <div class="campaign-status ${statusClass}" aria-label="Status: ${statusText}">${statusText}</div>
            <h3>${campaign.title}</h3>
            <div class="campaign-details">
                <p><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${campaign.location}</p>
                <p><i class="fas fa-calendar" aria-hidden="true"></i> ${this.formatDate(campaign.date)}</p>
                <p><i class="fas fa-users" aria-hidden="true"></i> Meta: ${campaign.goal} doadores</p>
            </div>
            <div class="campaign-progress">
                <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso da campanha: ${progress}% - ${campaign.current || 0} de ${campaign.goal} doadores">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>
                <div class="sr-only">${campaign.current || 0} de ${campaign.goal} doadores já participaram</div>
            </div>
            <a href="login.html" class="campaign-button" aria-describedby="participate-desc-${campaign.id}">Quero Participar</a>
            <div id="participate-desc-${campaign.id}" class="sr-only">Clique para se inscrever na campanha ${campaign.title}</div>
        `;

        return card;
    }

    /**
     * Atualiza um card de campanha individual
     */
    updateCampaignCard(card, campaign) {
        // Atualizar título
        const title = card.querySelector('h3');
        if (title) title.textContent = campaign.title;

        // Atualizar detalhes
        const details = card.querySelectorAll('.campaign-details p');
        if (details.length >= 3) {
            details[0].innerHTML = `<i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${campaign.location}`;
            details[1].innerHTML = `<i class="fas fa-calendar" aria-hidden="true"></i> ${this.formatDate(campaign.date)}`;
            details[2].innerHTML = `<i class="fas fa-users" aria-hidden="true"></i> Meta: ${campaign.goal || 50} doadores`;
        }

        // Atualizar barra de progresso
        const progressBar = card.querySelector('.progress');
        if (progressBar && campaign.goal && campaign.current) {
            const percentage = Math.round((campaign.current / campaign.goal) * 100);
            progressBar.style.width = `${percentage}%`;
            
            // Atualizar ARIA labels
            const progressContainer = card.querySelector('.progress-bar');
            if (progressContainer) {
                progressContainer.setAttribute('aria-valuenow', percentage);
                progressContainer.setAttribute('aria-label', `Progresso da campanha: ${percentage}% - ${campaign.current} de ${campaign.goal} doadores`);
            }
        }

        // Atualizar status baseado na categoria e urgência
        const status = card.querySelector('.campaign-status');
        if (status) {
        // CORRIGIDO: Status com cores corretas
        let statusText, statusClass, ariaLabel;
        
        if (campaign.category === 'urgente' || campaign.bloodType === 'O-') {
            statusText = 'Urgente';
            statusClass = 'campaign-status urgent';  // ✅ VERMELHO
            ariaLabel = 'Status: Urgente';
        } else if (campaign.category === 'ativa') {
            statusText = 'Ativa';
            statusClass = 'campaign-status active';   // ✅ VERDE
            ariaLabel = 'Status: Ativa';
        } else if (campaign.category === 'planejamento') {
            statusText = 'Planejamento';
            statusClass = 'campaign-status planning'; // ✅ AZUL
            ariaLabel = 'Status: Em Planejamento';
        } else {
            // Fallback para campanhas sem categoria definida - assumir como ativa
            statusText = 'Ativa';
            statusClass = 'campaign-status active';   // ✅ VERDE
            ariaLabel = 'Status: Ativa';
        }
            
            status.textContent = statusText;
            status.className = statusClass;
            status.setAttribute('aria-label', ariaLabel);
            
            console.log(`🎨 Status atualizado: ${campaign.title} -> ${statusText} (${campaign.category || 'sem categoria'})`);
        }

        // Atualizar tipo sanguíneo se existir campo específico
        const bloodTypeElement = card.querySelector('.blood-type');
        if (bloodTypeElement) {
            bloodTypeElement.textContent = campaign.bloodType;
        }

        // Atualizar horário se existir
        const timeElement = card.querySelector('.campaign-time');
        if (timeElement && campaign.time) {
            timeElement.innerHTML = `<i class="fas fa-clock" aria-hidden="true"></i> ${campaign.time}`;
        }
    }

    /**
     * Atualiza página completa de campanhas ativas
     */
    updateCampaignsPage() {
        console.log('🏕️ INICIANDO atualização da página Campanhas Ativas...');
        
        const approvedCampaigns = this.campaigns.filter(c => c.status === 'approved');
        
        // LÓGICA CORRIGIDA: Separar campanhas de forma mais inteligente
        const urgentCampaigns = approvedCampaigns.filter(c => 
            c.category === 'urgente' || c.bloodType === 'O-'
        );
        const activeCampaigns = approvedCampaigns.filter(c => 
            c.category === 'ativa' || (c.category !== 'urgente' && c.bloodType !== 'O-' && c.category !== 'planejamento')
        );
        const planningCampaigns = approvedCampaigns.filter(c => 
            c.category === 'planejamento'
        );

        console.log('📊 CAMPANHAS SEPARADAS POR CATEGORIA:', {
            total: approvedCampaigns.length,
            urgentes: urgentCampaigns.length,
            ativas: activeCampaigns.length,
            planejamento: planningCampaigns.length
        });

        // Log detalhado das campanhas
        console.log('🚨 CAMPANHAS URGENTES:', urgentCampaigns.map(c => `${c.title} (${c.category})`));
        console.log('✅ CAMPANHAS ATIVAS:', activeCampaigns.map(c => `${c.title} (${c.category})`));
        console.log('📋 CAMPANHAS PLANEJAMENTO:', planningCampaigns.map(c => `${c.title} (${c.category})`));

        // Substituir completamente o conteúdo estático por dinâmico
        this.replaceAllCampaignSections(urgentCampaigns, activeCampaigns, planningCampaigns);
        
        console.log('✅ FINALIZADA atualização da página Campanhas Ativas!');
    }

    /**
     * Substitui todas as seções de campanhas por conteúdo dinâmico do admin
     */
    replaceAllCampaignSections(urgentCampaigns, activeCampaigns, planningCampaigns) {
        // Encontrar e substituir seção de campanhas urgentes
        const urgentSection = this.findSectionByTitle('Campanhas Urgentes');
        if (urgentSection) {
            this.replaceSectionContent(urgentSection, urgentCampaigns, 'urgent');
            console.log(`🚨 Seção urgentes atualizada com ${urgentCampaigns.length} campanhas`);
        }

        // Encontrar e substituir seção de campanhas ativas
        const activeSection = this.findSectionByTitle('Campanhas Ativas');
        if (activeSection) {
            this.replaceSectionContent(activeSection, activeCampaigns, 'active');
            console.log(`✅ Seção ativas atualizada com ${activeCampaigns.length} campanhas`);
        }

        // Criar seção de planejamento se houver campanhas e não existir
        if (planningCampaigns.length > 0) {
            let planningSection = this.findSectionByTitle('Campanhas em Planejamento');
            if (!planningSection) {
                planningSection = this.createPlanningSection();
            }
            if (planningSection) {
                this.replaceSectionContent(planningSection, planningCampaigns, 'planning');
                console.log(`📋 Seção planejamento atualizada com ${planningCampaigns.length} campanhas`);
            }
        }
    }

    /**
     * Encontra uma seção pelo título
     */
    findSectionByTitle(titleText) {
        const sections = document.querySelectorAll('.campaigns-section');
        for (const section of sections) {
            const title = section.querySelector('h2');
            if (title && title.textContent.includes(titleText.split(' ')[1])) {
                return section;
            }
        }
        return null;
    }

    /**
     * Substitui o conteúdo de uma seção com campanhas do admin
     */
    replaceSectionContent(section, campaigns, statusType) {
        const grid = section.querySelector('.campaigns-grid');
        if (!grid) return;

        // Limpar grid completamente
        grid.innerHTML = '';

        // Adicionar campanhas do admin
        campaigns.forEach(campaign => {
            const card = this.createCampaignCard(campaign);
            grid.appendChild(card);
        });

        // Se não houver campanhas, mostrar mensagem
        if (campaigns.length === 0) {
            grid.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 2rem;
                    color: #6b7280;
                    font-style: italic;
                ">
                    Nenhuma campanha ${statusType === 'urgent' ? 'urgente' : statusType === 'active' ? 'ativa' : 'em planejamento'} no momento.
                </div>
            `;
        }
    }

    /**
     * Substitui campanhas estáticas pelas do admin
     */
    replaceStaticCampaigns(urgentCampaigns, activeCampaigns, planningCampaigns) {
        // Substituir seção de campanhas urgentes
        const urgentSection = document.querySelector('.campaigns-section h2');
        if (urgentSection && urgentSection.textContent.includes('Urgentes')) {
            const urgentGrid = urgentSection.parentElement.querySelector('.campaigns-grid');
            if (urgentGrid) {
                urgentGrid.innerHTML = '';
                urgentCampaigns.forEach(campaign => {
                    const card = this.createCampaignCard(campaign);
                    urgentGrid.appendChild(card);
                });
                console.log(`🚨 ${urgentCampaigns.length} campanhas urgentes atualizadas`);
            }
        }

        // Substituir seção de campanhas ativas
        const activeSection = document.querySelector('.campaigns-section h2');
        const allSections = document.querySelectorAll('.campaigns-section');
        allSections.forEach(section => {
            const title = section.querySelector('h2');
            if (title && title.textContent.includes('Ativas')) {
                const activeGrid = section.querySelector('.campaigns-grid');
                if (activeGrid) {
                    activeGrid.innerHTML = '';
                    activeCampaigns.forEach(campaign => {
                        const card = this.createCampaignCard(campaign);
                        activeGrid.appendChild(card);
                    });
                    console.log(`✅ ${activeCampaigns.length} campanhas ativas atualizadas`);
                }
            }
        });

        // Criar seção de planejamento se houver campanhas
        if (planningCampaigns.length > 0) {
            this.createPlanningSection(planningCampaigns);
        }
    }

    /**
     * Cria seção de campanhas em planejamento
     */
    createPlanningSection(planningCampaigns) {
        // Verificar se já existe
        if (document.querySelector('.planning-section')) return;

        const lastSection = document.querySelector('.campaigns-section:last-of-type');
        if (!lastSection) return;

        const planningSection = document.createElement('section');
        planningSection.className = 'campaigns-section planning-section';
        planningSection.innerHTML = `
            <h2><i class="fas fa-calendar-alt"></i> Campanhas em Planejamento</h2>
            <div class="campaigns-grid"></div>
        `;

        const planningGrid = planningSection.querySelector('.campaigns-grid');
        planningCampaigns.forEach(campaign => {
            const card = this.createCampaignCard(campaign);
            planningGrid.appendChild(card);
        });

        lastSection.insertAdjacentElement('afterend', planningSection);
        console.log(`📋 ${planningCampaigns.length} campanhas em planejamento criadas`);
    }

    /**
     * Cria campanhas dinamicamente na página
     */
    createDynamicCampaigns(campaigns) {
        const campaignsGrid = document.querySelector('.campaigns-grid');
        if (!campaignsGrid) return;

        // Limpar campanhas existentes que não são do admin
        const existingCards = campaignsGrid.querySelectorAll('.campaign-card:not([data-admin-sync])');
        existingCards.forEach(card => {
            // Manter apenas as primeiras 2 campanhas como exemplo
            const cardIndex = Array.from(campaignsGrid.children).indexOf(card);
            if (cardIndex >= 2) {
                card.remove();
            }
        });

        // Adicionar campanhas do admin (começando da terceira posição)
        campaigns.slice(2).forEach(campaign => {
            const campaignCard = this.createCampaignCard(campaign);
            campaignsGrid.appendChild(campaignCard);
        });
    }

    /**
     * Cria um card de campanha HTML - VERSÃO UNIFICADA E CORRIGIDA
     */
    createCampaignCard(campaign) {
        const card = document.createElement('article');
        card.className = 'campaign-card';
        card.setAttribute('data-admin-sync', 'true');
        card.setAttribute('data-category', campaign.category);

        // ✅ LÓGICA CORRIGIDA: Status baseado na categoria
        let statusClass = 'active';
        let statusText = 'Ativa';
        
        if (campaign.category === 'urgente' || campaign.bloodType === 'O-') {
            statusClass = 'urgent';
            statusText = 'Urgente';
        } else if (campaign.category === 'ativa') {
            statusClass = 'active';
            statusText = 'Ativa';
        } else if (campaign.category === 'planejamento') {
            statusClass = 'planning';
            statusText = 'Planejamento';
        }

        // Calcular progresso
        const progress = campaign.goal ? Math.round((campaign.current / campaign.goal) * 100) : 0;
        const currentDonors = campaign.current || 0;
        const goalDonors = campaign.goal || 50;

        // Estrutura para página principal (index.html)
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            card.innerHTML = `
                <div class="campaign-status ${statusClass}" aria-label="Status: ${statusText}">${statusText}</div>
                <h3>${campaign.title}</h3>
                <div class="campaign-details">
                    <p><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${campaign.location}</p>
                    <p><i class="fas fa-calendar" aria-hidden="true"></i> ${this.formatDate(campaign.date)}</p>
                    <p><i class="fas fa-users" aria-hidden="true"></i> Meta: ${campaign.goal} doadores</p>
                </div>
                <div class="campaign-progress">
                    <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso da campanha: ${progress}% - ${campaign.current || 0} de ${campaign.goal} doadores">
                        <div class="progress" style="width: ${progress}%"></div>
                    </div>
                    <div class="sr-only">${campaign.current || 0} de ${campaign.goal} doadores já participaram</div>
                </div>
                <a href="login.html" class="campaign-button" aria-describedby="participate-desc-${campaign.id}">Quero Participar</a>
                <div id="participate-desc-${campaign.id}" class="sr-only">Clique para se inscrever na campanha ${campaign.title}</div>
            `;
        } else {
            // ✅ ESTRUTURA CORRIGIDA para página de campanhas ativas
            card.innerHTML = `
                <div class="campaign-status ${statusClass}" aria-label="Status: ${statusText}">${statusText}</div>
                <h3>${campaign.title}</h3>
                <div class="campaign-info">
                    <p><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${campaign.location}</p>
                    <p><i class="fas fa-calendar" aria-hidden="true"></i> ${this.formatDate(campaign.date)}</p>
                    <p><i class="fas fa-clock" aria-hidden="true"></i> ${campaign.time || '08:00 - 17:00'}</p>
                    <p><i class="fas fa-tint" aria-hidden="true"></i> Tipo Sanguíneo: ${campaign.bloodType}</p>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${currentDonors}/${goalDonors} doadores</span>
                </div>
                <a href="login.html" class="participate-button">Participar</a>
            `;
        }

        console.log(`🏷️ Card criado para campanha: ${campaign.title} - Categoria: ${campaign.category} - Status: ${statusText}`);
        return card;
    }

    // Funções de contadores de categoria removidas conforme solicitado

    /**
     * Atualiza uma seção específica de campanhas
     */
    updateCampaignSection(sectionTitle, campaigns, statusClass) {
        const sections = document.querySelectorAll('.campaigns-section');
        
        sections.forEach(section => {
            const title = section.querySelector('h2');
            if (title && title.textContent.includes(sectionTitle.split(' ')[1])) {
                const grid = section.querySelector('.campaigns-grid');
                if (grid) {
                    // Limpar grid
                    grid.innerHTML = '';
                    
                    // Adicionar campanhas
                    campaigns.forEach(campaign => {
                        const card = this.createCampaignCard(campaign);
                        grid.appendChild(card);
                    });
                }
            }
        });
    }

    /**
     * REMOVIDA: Função duplicada que causava inconsistências
     */

    /**
     * Atualiza alerta de emergência
     */
    updateEmergencyAlert() {
        const emergencySection = document.querySelector('.emergency-alert');
        
        if (emergencySection) {
            const title = emergencySection.querySelector('h3');
            const button = emergencySection.querySelector('.alert-button');
            
            // Verificar se deve mostrar alerta
            if (this.settings.emergencyAlert === false || this.settings.emergencyAlert === 'false') {
                emergencySection.style.display = 'none';
                return;
            } else {
                emergencySection.style.display = 'flex';
            }
            
            // Atualizar mensagem
            if (this.settings.emergencyMessage && title) {
                title.textContent = this.settings.emergencyMessage;
            }
            
            // Atualizar botão
            if (button) {
                button.textContent = 'Quero Ajudar';
            }
        }

        console.log('🚨 Alerta de emergência atualizado');
    }

    /**
     * Mostra modo manutenção
     */
    showMaintenanceMode() {
        // Criar overlay de manutenção
        const overlay = document.createElement('div');
        overlay.id = 'maintenance-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            font-family: 'Poppins', sans-serif;
        `;
        
        overlay.innerHTML = `
            <div>
                <i class="fas fa-tools" style="font-size: 4rem; color: #e60000; margin-bottom: 2rem;"></i>
                <h1 style="font-size: 2rem; margin-bottom: 1rem;">Site em Manutenção</h1>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">Estamos trabalhando para melhorar sua experiência.</p>
                <p style="font-size: 1rem; opacity: 0.8;">Voltaremos em breve!</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        console.log('🔧 Modo manutenção ativado');
    }

    /**
     * Anima mudança de números
     */
    animateNumber(element, from, to) {
        if (from === to) return;
        
        const duration = 1000;
        const steps = 30;
        const stepValue = (to - from) / steps;
        let current = from;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            current += stepValue;
            
            if (step >= steps) {
                current = to;
                clearInterval(timer);
            }
            
            // Formatar número com separadores de milhares
            const formatted = Math.round(current).toLocaleString('pt-BR');
            element.textContent = formatted + (element.textContent.includes('+') ? '+' : '');
        }, duration / steps);
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    /**
     * Inicia sincronização automática
     */
    startAutoSync() {
        setInterval(() => {
            this.syncWithAdmin();
        }, this.syncInterval);
        
        console.log(`🔄 Sincronização automática iniciada (${this.syncInterval/1000}s)`);
    }

    /**
     * Sincroniza com dados do painel admin
     */
    syncWithAdmin() {
        const currentTime = new Date().getTime();
        
        // Verificar se houve mudanças no localStorage
        const newSettings = localStorage.getItem('siteSettings');
        const newCampaigns = localStorage.getItem('adminCampaigns');
        
        let hasChanges = false;
        
        if (newSettings && newSettings !== JSON.stringify(this.settings)) {
            this.loadSettings();
            this.applySettings();
            hasChanges = true;
        }
        
        if (newCampaigns && newCampaigns !== JSON.stringify(this.campaigns)) {
            this.loadCampaigns();
            this.updateCampaigns();
            hasChanges = true;
        }
        
        if (hasChanges) {
            this.loadStats();
            this.updateStats();
            this.updateEmergencyAlert();
            
            console.log('🔄 Sincronização realizada:', new Date().toLocaleTimeString());
            
            // Mostrar notificação de atualização
            this.showSyncNotification();
        }
        
        this.lastSync = currentTime;
    }

    /**
     * Mostra notificação de sincronização
     */
    showSyncNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            font-family: 'Poppins', sans-serif;
            font-size: 0.9rem;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-sync-alt" style="margin-right: 0.5rem;"></i>
            Conteúdo atualizado automaticamente
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Força sincronização manual
     */
    forcSync() {
        this.syncWithAdmin();
        console.log('🔄 Sincronização forçada executada');
    }
}

// Inicializar sincronização quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.adminSync = new AdminSync();
    
    // ✅ FORÇAR SINCRONIZAÇÃO IMEDIATA para páginas específicas
    setTimeout(() => {
        if (window.location.pathname.includes('campanhas-ativas.html')) {
            console.log('🔄 FORÇANDO sincronização para página Campanhas Ativas...');
            window.adminSync.updateCampaignsPage();
        }
    }, 500); // Aguardar 500ms para garantir que tudo carregou
    
    // Disponibilizar função global para forçar sync
    window.forceAdminSync = () => {
        if (window.adminSync) {
            window.adminSync.forcSync();
        }
    };
});

// Adicionar estilos para animações
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
