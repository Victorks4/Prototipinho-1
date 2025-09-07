/**
 * HemoByte Store - Sistema Centralizado de Gerenciamento de Estado
 * Unifica todos os dados do sistema em um local centralizado
 */

class HemoByteStore {
    constructor() {
        this.state = {
            // Dados do usuário
            user: null,
            isLoggedIn: false,
            loginTime: null,
            lastActivity: null,
            
            // Campanhas
            campaigns: [],
            featuredCampaigns: [],
            urgentCampaigns: [],
            activeCampaigns: [],
            planningCampaigns: [],
            
            // Estatísticas
            stats: {
                totalDonations: 1500,
                totalUsers: 12,
                totalHospitals: 6000
            },
            
            // Configurações do sistema
            settings: {
                emergencyAlert: null,
                maintenanceMode: false,
                notifications: true
            },
            
            // Estado da interface
            ui: {
                currentPage: null,
                loading: false,
                notifications: []
            }
        };
        
        // Listeners para mudanças de estado
        this.listeners = new Map();
        
        // Inicializar store
        this.init();
    }
    
    /**
     * Inicializa o store carregando dados do localStorage
     */
    init() {
        console.log('🏪 Inicializando HemoByte Store...');
        
        // Carregar dados do localStorage
        this.loadFromStorage();
        
        // Configurar sincronização automática
        this.setupAutoSync();
        
        // Configurar listeners de storage
        this.setupStorageListeners();
        
        console.log('✅ HemoByte Store inicializado!', this.state);
    }
    
    /**
     * Carrega dados do localStorage
     */
    loadFromStorage() {
        try {
            // Carregar usuário
            const userData = localStorage.getItem('usuario');
            if (userData) {
                this.state.user = JSON.parse(userData);
                this.state.isLoggedIn = true;
            }
            
            // Carregar campanhas
            const campaignsData = localStorage.getItem('hemobyte_campaigns') || 
                                localStorage.getItem('adminCampaigns');
            if (campaignsData) {
                this.state.campaigns = JSON.parse(campaignsData);
                this.organizeCampaigns();
            }
            
            // Carregar estatísticas
            const statsData = localStorage.getItem('hemobyte_stats');
            if (statsData) {
                this.state.stats = { ...this.state.stats, ...JSON.parse(statsData) };
            }
            
            // Carregar configurações
            const settingsData = localStorage.getItem('hemobyte_settings');
            if (settingsData) {
                this.state.settings = { ...this.state.settings, ...JSON.parse(settingsData) };
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados do storage:', error);
        }
    }
    
    /**
     * Organiza campanhas por categoria
     */
    organizeCampaigns() {
        const approvedCampaigns = this.state.campaigns.filter(c => c.status === 'approved');
        
        this.state.urgentCampaigns = approvedCampaigns.filter(c => 
            c.category === 'urgente' || c.bloodType === 'O-'
        );
        
        this.state.activeCampaigns = approvedCampaigns.filter(c => 
            c.category === 'ativa' || (c.category !== 'urgente' && c.bloodType !== 'O-' && c.category !== 'planejamento')
        );
        
        this.state.planningCampaigns = approvedCampaigns.filter(c => 
            c.category === 'planejamento'
        );
        
        // Campanhas em destaque (1 urgente + 1 ativa)
        this.state.featuredCampaigns = [];
        if (this.state.urgentCampaigns.length > 0) {
            this.state.featuredCampaigns.push(this.state.urgentCampaigns[0]);
        }
        if (this.state.activeCampaigns.length > 0) {
            this.state.featuredCampaigns.push(this.state.activeCampaigns[0]);
        }
    }
    
    /**
     * Configura sincronização automática
     */
    setupAutoSync() {
        // Salvar no localStorage a cada mudança
        this.subscribe('*', () => {
            this.saveToStorage();
        });
        
        // Sincronização periódica
        setInterval(() => {
            this.syncWithServer();
        }, 30000); // 30 segundos
    }
    
    /**
     * Configura listeners de storage para sincronização entre abas
     */
    setupStorageListeners() {
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('hemobyte_')) {
                console.log('🔄 Sincronizando dados entre abas:', e.key);
                this.loadFromStorage();
                this.notifyListeners('storage_sync', { key: e.key, newValue: e.newValue });
            }
        });
        
        // BroadcastChannel para sincronização mais rápida
        if (window.BroadcastChannel) {
            this.broadcastChannel = new BroadcastChannel('hemobyte_sync');
            this.broadcastChannel.addEventListener('message', (e) => {
                if (e.data.type === 'state_update') {
                    this.loadFromStorage();
                    this.notifyListeners('broadcast_sync', e.data);
                }
            });
        }
    }
    
    /**
     * Salva dados no localStorage
     */
    saveToStorage() {
        try {
            // Salvar usuário
            if (this.state.user) {
                localStorage.setItem('usuario', JSON.stringify(this.state.user));
            }
            
            // Salvar campanhas
            if (this.state.campaigns.length > 0) {
                localStorage.setItem('hemobyte_campaigns', JSON.stringify(this.state.campaigns));
                // Manter compatibilidade
                localStorage.setItem('adminCampaigns', JSON.stringify(this.state.campaigns));
            }
            
            // Salvar estatísticas
            localStorage.setItem('hemobyte_stats', JSON.stringify(this.state.stats));
            
            // Salvar configurações
            localStorage.setItem('hemobyte_settings', JSON.stringify(this.state.settings));
            
            // Notificar outras abas
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage({
                    type: 'state_update',
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar dados no storage:', error);
        }
    }
    
    /**
     * Sincroniza com o servidor
     */
    async syncWithServer() {
        // Implementar sincronização com servidor quando necessário
        console.log('🔄 Sincronização com servidor (placeholder)');
    }
    
    /**
     * Obtém estado atual
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Obtém parte específica do estado
     */
    get(path) {
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Atualiza estado
     */
    setState(updates) {
        const oldState = { ...this.state };
        
        // Aplicar atualizações
        if (typeof updates === 'function') {
            this.state = { ...this.state, ...updates(this.state) };
        } else {
            this.state = { ...this.state, ...updates };
        }
        
        // Reorganizar campanhas se necessário
        if (updates.campaigns) {
            this.organizeCampaigns();
        }
        
        // Notificar listeners
        this.notifyListeners('state_change', { oldState, newState: this.state, updates });
        
        console.log('🔄 Estado atualizado:', updates);
    }
    
    /**
     * Atualiza parte específica do estado
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;
        
        // Navegar até o objeto pai
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        // Definir valor
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        // Reorganizar campanhas se necessário
        if (path.includes('campaigns')) {
            this.organizeCampaigns();
        }
        
        // Notificar listeners
        this.notifyListeners('property_change', { path, oldValue, newValue: value });
        
        console.log(`🔄 Propriedade ${path} atualizada:`, value);
    }
    
    /**
     * Adiciona listener para mudanças de estado
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        // Retorna função para remover listener
        return () => {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }
    
    /**
     * Notifica listeners
     */
    notifyListeners(event, data) {
        // Listeners específicos
        const specificListeners = this.listeners.get(event) || [];
        specificListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Erro no listener ${event}:`, error);
            }
        });
        
        // Listeners globais
        const globalListeners = this.listeners.get('*') || [];
        globalListeners.forEach(callback => {
            try {
                callback({ event, data });
            } catch (error) {
                console.error(`❌ Erro no listener global:`, error);
            }
        });
    }
    
    /**
     * Limpa todos os dados
     */
    clear() {
        this.state = {
            user: null,
            isLoggedIn: false,
            loginTime: null,
            lastActivity: null,
            campaigns: [],
            featuredCampaigns: [],
            urgentCampaigns: [],
            activeCampaigns: [],
            planningCampaigns: [],
            stats: {
                totalDonations: 1500,
                totalUsers: 12,
                totalHospitals: 6000
            },
            settings: {
                emergencyAlert: null,
                maintenanceMode: false,
                notifications: true
            },
            ui: {
                currentPage: null,
                loading: false,
                notifications: []
            }
        };
        
        // Limpar localStorage
        const keys = ['usuario', 'hemobyte_campaigns', 'adminCampaigns', 'hemobyte_stats', 'hemobyte_settings'];
        keys.forEach(key => localStorage.removeItem(key));
        
        this.notifyListeners('clear', {});
        console.log('🗑️ Store limpo!');
    }
    
    /**
     * Debug - mostra estado atual
     */
    debug() {
        console.group('🏪 HemoByte Store Debug');
        console.log('Estado atual:', this.state);
        console.log('Listeners:', this.listeners);
        console.log('LocalStorage keys:', Object.keys(localStorage).filter(k => k.includes('hemobyte') || k === 'usuario'));
        console.groupEnd();
    }
}

// Instância global do store
window.hemoByteStore = new HemoByteStore();

// Disponibilizar globalmente para compatibilidade
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HemoByteStore;
}

console.log('🏪 HemoByte Store carregado!');
