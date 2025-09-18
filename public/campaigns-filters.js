/**
 * HemoByte - Filtros Inteligentes
 * Deixa as pessoas encontrarem exatamente o que procuram
 */

class CampaignsFilters {
    constructor() {
        this.allCampaigns = [];
        this.filteredCampaigns = [];
        this.currentFilters = {
            search: '',
            bairro: '',
            tipoSanguineo: '',
            status: '',
            data: ''
        };
        
        this.init();
    }

    init() {
        // Aguarda o DOM estar carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupFilters());
        } else {
            this.setupFilters();
        }
    }

    setupFilters() {
        try {
            this.collectCampaigns();
            this.setupEventListeners();
            this.applyFilters();
        } catch (error) {
            // Se der erro, vida que segue
        }
    }

    collectCampaigns() {
        const campaignCards = document.querySelectorAll('.campaign-card');
        this.allCampaigns = Array.from(campaignCards).map((card, index) => {
            return {
                element: card,
                id: index,
                title: this.extractText(card, 'h3'),
                bairro: this.extractBairro(card),
                tipoSanguineo: this.extractTipoSanguineo(card),
                status: this.extractStatus(card),
                data: this.extractData(card),
                hora: this.extractHora(card),
                originalText: card.textContent.toLowerCase(),
                visible: true
            };
        });
        
        this.filteredCampaigns = [...this.allCampaigns];
        
        // Mostra tipos sanguíneos extraídos para debug
        console.log('Tipos sanguíneos extraídos:', 
            this.allCampaigns.map(c => ({ title: c.title, tipo: c.tipoSanguineo }))
        );
    }

    extractText(card, selector) {
        const element = card.querySelector(selector);
        return element ? element.textContent.trim() : '';
    }

    extractBairro(card) {
        const locationElement = card.querySelector('.campaign-info p:first-child');
        if (!locationElement) return '';
        
        const text = locationElement.textContent;
        
        // Mapeia os bairros
        const bairros = {
            'feira vi': 'feira-vi',
            'tomba': 'tomba',
            'centro': 'centro',
            'queimadinha': 'queimadinha',
            'cidade nova': 'cidade-nova',
            'uefs': 'uefs'
        };
        
        const textLower = text.toLowerCase();
        for (const [nome, codigo] of Object.entries(bairros)) {
            if (textLower.includes(nome)) {
                return codigo;
            }
        }
        
        return 'outros';
    }

    extractTipoSanguineo(card) {
        const infoElements = card.querySelectorAll('.campaign-info p');
        for (const element of infoElements) {
            const text = element.textContent.toLowerCase();
            
            if (text.includes('tipo sanguíneo') || text.includes('tipo sangue')) {
                // Extrai o tipo sanguíneo
                const match = text.match(/(a\+|a-|b\+|b-|ab\+|ab-|o\+|o-)/i);
                if (match) {
                    return match[1].toLowerCase();
                }
            }
        }
        return '';
    }

    extractStatus(card) {
        const statusElement = card.querySelector('.campaign-status');
        if (!statusElement) return 'active';
        
        const statusText = statusElement.textContent.toLowerCase();
        
        if (statusText.includes('urgent')) return 'urgent';
        if (statusText.includes('urgente')) return 'urgent';
        if (statusText.includes('planning')) return 'planning';
        if (statusText.includes('planejamento')) return 'planning';
        
        return 'active';
    }

    extractData(card) {
        const infoElements = card.querySelectorAll('.campaign-info p');
        for (const element of infoElements) {
            const text = element.textContent;
            if (text.includes('📅') || text.includes('calendar') || text.includes('data')) {
                return text;
            }
        }
        return '';
    }

    extractHora(card) {
        const infoElements = card.querySelectorAll('.campaign-info p');
        for (const element of infoElements) {
            const text = element.textContent;
            if (text.includes('🕐') || text.includes('clock') || text.includes('hora')) {
                return text;
            }
        }
        return '';
    }

    setupEventListeners() {
        // Campo de busca
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Filtros de dropdown
        const bairroFilter = document.getElementById('bairro-filter');
        if (bairroFilter) {
            bairroFilter.addEventListener('change', (e) => {
                this.currentFilters.bairro = e.target.value;
                this.applyFilters();
            });
        }

        const tipoFilter = document.getElementById('tipo-sanguineo-filter');
        if (tipoFilter) {
            tipoFilter.addEventListener('change', (e) => {
                this.currentFilters.tipoSanguineo = e.target.value;
                this.applyFilters();
            });
        }

        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        const dataFilter = document.getElementById('data-filter');
        if (dataFilter) {
            dataFilter.addEventListener('change', (e) => {
                this.currentFilters.data = e.target.value;
                this.applyFilters();
            });
        }

        // Botão de busca
        const searchButton = document.querySelector('.search-button');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    this.currentFilters.search = searchInput.value.toLowerCase();
                    this.applyFilters();
                }
            });
        }

        // Limpar filtros
        this.addClearFiltersButton();
    }

    addClearFiltersButton() {
        const filtersContainer = document.querySelector('.filters-container');
        if (!filtersContainer) return;

        // Verifica se o botão já existe
        if (document.getElementById('clear-filters-btn')) return;

        const clearButton = document.createElement('button');
        clearButton.id = 'clear-filters-btn';
        clearButton.className = 'clear-filters-button';
        clearButton.innerHTML = '<i class="fas fa-times"></i> Limpar Filtros';
        clearButton.title = 'Limpar todos os filtros';
        
        clearButton.addEventListener('click', () => {
            this.clearAllFilters();
        });

        filtersContainer.appendChild(clearButton);
    }

    applyFilters() {
        this.filteredCampaigns = this.allCampaigns.filter(campaign => {
            return this.matchesFilters(campaign);
        });

        this.updateCampaignVisibility();
        this.updateResultsCount();
    }

    matchesFilters(campaign) {
        // Busca por texto
        if (this.currentFilters.search) {
            const searchTerms = this.currentFilters.search.split(' ');
            const searchMatch = searchTerms.every(term => 
                campaign.originalText.includes(term)
            );
            if (!searchMatch) return false;
        }

        // Filtro de bairro
        if (this.currentFilters.bairro && campaign.bairro !== this.currentFilters.bairro) {
            return false;
        }

        // Filtro de tipo sanguíneo
        if (this.currentFilters.tipoSanguineo && campaign.tipoSanguineo !== this.currentFilters.tipoSanguineo) {
            return false;
        }

        // Filtro de status
        if (this.currentFilters.status && campaign.status !== this.currentFilters.status) {
            return false;
        }

        // Filtro de data
        if (this.currentFilters.data && !this.matchesDateFilter(campaign)) {
            return false;
        }

        return true;
    }

    matchesDateFilter(campaign) {
        if (!this.currentFilters.data) return true;

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (this.currentFilters.data) {
            case 'hoje':
                return campaign.data.toLowerCase().includes('hoje') || 
                       campaign.data.includes(today.toLocaleDateString('pt-BR'));
            
            case 'amanha':
                return campaign.data.toLowerCase().includes('amanhã') ||
                       campaign.data.includes(tomorrow.toLocaleDateString('pt-BR'));
            
            case 'semana':
                return true; // Simplificado
            
            case 'mes':
                return true; // Simplificado
            
            default:
                return true;
        }
    }

    updateCampaignVisibility() {
        this.allCampaigns.forEach(campaign => {
            const isVisible = this.filteredCampaigns.includes(campaign);
            campaign.element.style.display = isVisible ? 'block' : 'none';
            campaign.visible = isVisible;
        });

        this.updateSectionsVisibility();
    }

    updateSectionsVisibility() {
        const sections = document.querySelectorAll('.campaigns-section');
        sections.forEach(section => {
            const visibleCampaigns = section.querySelectorAll('.campaign-card[style*="block"], .campaign-card:not([style*="none"])');
            
            if (visibleCampaigns.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
    }

    updateResultsCount() {
        let resultsCount = document.getElementById('results-count');
        
        if (!resultsCount) {
            resultsCount = document.createElement('div');
            resultsCount.id = 'results-count';
            resultsCount.className = 'results-count';
            
            const searchSection = document.querySelector('.search-section');
            if (searchSection) {
                searchSection.appendChild(resultsCount);
            }
        }

        const total = this.allCampaigns.length;
        const filtered = this.filteredCampaigns.length;
        
        if (filtered === total) {
            resultsCount.textContent = `${total} campanhas encontradas`;
        } else {
            resultsCount.textContent = `${filtered} de ${total} campanhas`;
        }

        resultsCount.className = 'results-count';
        if (filtered === 0) {
            resultsCount.classList.add('no-results');
        } else if (filtered < total) {
            resultsCount.classList.add('filtered');
        }
    }

    clearAllFilters() {
        this.currentFilters = {
            search: '',
            bairro: '',
            tipoSanguineo: '',
            status: '',
            data: ''
        };

        // Limpa os inputs
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.value = '';

        const selects = document.querySelectorAll('.filter-select');
        selects.forEach(select => select.value = '');

        this.applyFilters();
    }

    getFilterStats() {
        return {
            total: this.allCampaigns.length,
            filtered: this.filteredCampaigns.length,
            visible: this.filteredCampaigns.filter(c => c.visible).length,
            filters: { ...this.currentFilters }
        };
    }
}

// Inicializa o sistema de filtros
window.campaignsFilters = new CampaignsFilters();

// Funções globais para uso externo
window.clearCampaignFilters = () => {
    if (window.campaignsFilters) {
        window.campaignsFilters.clearAllFilters();
    }
};

window.getCampaignFilterStats = () => {
    return window.campaignsFilters ? window.campaignsFilters.getFilterStats() : null;
};