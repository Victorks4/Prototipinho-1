/**
 * Sistema de Validação Dupla - HemoByte
 * Validação client-side e server-side sincronizada
 */

class ValidationSystem {
    constructor() {
        this.rules = new Map();
        this.validators = new Map();
        this.messages = new Map();
        
        // Configurar validadores padrão
        this.setupDefaultValidators();
        this.setupDefaultMessages();
        
        console.log('🔍 Sistema de validação inicializado');
    }
    
    /**
     * Configura validadores padrão
     */
    setupDefaultValidators() {
        // Email
        this.addValidator('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        });
        
        // Telefone brasileiro
        this.addValidator('phone', (value) => {
            const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
            return phoneRegex.test(value);
        });
        
        // CPF
        this.addValidator('cpf', (value) => {
            const cpf = value.replace(/\D/g, '');
            if (cpf.length !== 11) return false;
            
            // Verificar se não são todos iguais
            if (/^(\d)\1{10}$/.test(cpf)) return false;
            
            // Validar dígitos verificadores
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cpf.charAt(i)) * (10 - i);
            }
            let remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(cpf.charAt(9))) return false;
            
            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cpf.charAt(i)) * (11 - i);
            }
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(cpf.charAt(10))) return false;
            
            return true;
        });
        
        // Senha forte
        this.addValidator('strongPassword', (value) => {
            if (value.length < 8) return false;
            if (!/[a-z]/.test(value)) return false;
            if (!/[A-Z]/.test(value)) return false;
            if (!/\d/.test(value)) return false;
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return false;
            return true;
        });
        
        // Nome completo
        this.addValidator('fullName', (value) => {
            const parts = value.trim().split(' ');
            return parts.length >= 2 && parts.every(part => part.length >= 2);
        });
        
        // Data de nascimento (maior de idade)
        this.addValidator('adultAge', (value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age >= 18;
        });
        
        // URL válida
        this.addValidator('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });
        
        // Tipo sanguíneo
        this.addValidator('bloodType', (value) => {
            const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            return validTypes.includes(value);
        });
        
        // Número positivo
        this.addValidator('positiveNumber', (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
        });
        
        // Data futura
        this.addValidator('futureDate', (value) => {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date > today;
        });
        
        // Horário válido
        this.addValidator('timeFormat', (value) => {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timeRegex.test(value);
        });
    }
    
    /**
     * Configura mensagens padrão
     */
    setupDefaultMessages() {
        this.setMessage('required', 'Este campo é obrigatório');
        this.setMessage('email', 'Digite um email válido');
        this.setMessage('phone', 'Digite um telefone válido (XX) XXXXX-XXXX');
        this.setMessage('cpf', 'Digite um CPF válido');
        this.setMessage('strongPassword', 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo');
        this.setMessage('fullName', 'Digite nome e sobrenome');
        this.setMessage('adultAge', 'Você deve ser maior de idade');
        this.setMessage('url', 'Digite uma URL válida');
        this.setMessage('bloodType', 'Selecione um tipo sanguíneo válido');
        this.setMessage('positiveNumber', 'Digite um número positivo');
        this.setMessage('futureDate', 'A data deve ser futura');
        this.setMessage('timeFormat', 'Digite um horário válido (HH:MM)');
        this.setMessage('minLength', 'Mínimo de {min} caracteres');
        this.setMessage('maxLength', 'Máximo de {max} caracteres');
        this.setMessage('min', 'Valor mínimo: {min}');
        this.setMessage('max', 'Valor máximo: {max}');
    }
    
    /**
     * Adiciona validador customizado
     */
    addValidator(name, validator) {
        this.validators.set(name, validator);
    }
    
    /**
     * Define mensagem de erro
     */
    setMessage(rule, message) {
        this.messages.set(rule, message);
    }
    
    /**
     * Adiciona regras de validação para um campo
     */
    addRules(fieldName, rules) {
        this.rules.set(fieldName, rules);
    }
    
    /**
     * Valida um campo específico
     */
    validateField(fieldName, value, rules = null) {
        const fieldRules = rules || this.rules.get(fieldName) || [];
        const errors = [];
        
        for (const rule of fieldRules) {
            const error = this.validateRule(value, rule);
            if (error) {
                errors.push(error);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Valida uma regra específica
     */
    validateRule(value, rule) {
        // Regra obrigatória
        if (rule === 'required') {
            if (!value || value.toString().trim() === '') {
                return this.messages.get('required');
            }
            return null;
        }
        
        // Se valor está vazio e não é obrigatório, não validar outras regras
        if (!value || value.toString().trim() === '') {
            return null;
        }
        
        // Regras com parâmetros
        if (typeof rule === 'object') {
            return this.validateParameterizedRule(value, rule);
        }
        
        // Regras simples
        if (typeof rule === 'string') {
            const validator = this.validators.get(rule);
            if (validator && !validator(value)) {
                return this.messages.get(rule) || `Valor inválido para ${rule}`;
            }
        }
        
        // Regras customizadas (função)
        if (typeof rule === 'function') {
            const result = rule(value);
            if (result !== true) {
                return typeof result === 'string' ? result : 'Valor inválido';
            }
        }
        
        return null;
    }
    
    /**
     * Valida regras com parâmetros
     */
    validateParameterizedRule(value, rule) {
        const { type, ...params } = rule;
        
        switch (type) {
            case 'minLength':
                if (value.length < params.min) {
                    return this.messages.get('minLength').replace('{min}', params.min);
                }
                break;
                
            case 'maxLength':
                if (value.length > params.max) {
                    return this.messages.get('maxLength').replace('{max}', params.max);
                }
                break;
                
            case 'min':
                const minNum = parseFloat(value);
                if (isNaN(minNum) || minNum < params.min) {
                    return this.messages.get('min').replace('{min}', params.min);
                }
                break;
                
            case 'max':
                const maxNum = parseFloat(value);
                if (isNaN(maxNum) || maxNum > params.max) {
                    return this.messages.get('max').replace('{max}', params.max);
                }
                break;
                
            case 'pattern':
                const regex = new RegExp(params.pattern);
                if (!regex.test(value)) {
                    return params.message || 'Formato inválido';
                }
                break;
                
            case 'custom':
                const result = params.validator(value, params);
                if (result !== true) {
                    return typeof result === 'string' ? result : params.message || 'Valor inválido';
                }
                break;
        }
        
        return null;
    }
    
    /**
     * Valida formulário completo
     */
    validateForm(formData, rules = null) {
        const results = {};
        let isValid = true;
        
        // Usar regras fornecidas ou regras registradas
        const formRules = rules || this.rules;
        
        for (const [fieldName, fieldRules] of formRules) {
            const value = formData[fieldName];
            const result = this.validateField(fieldName, value, fieldRules);
            
            results[fieldName] = result;
            
            if (!result.isValid) {
                isValid = false;
            }
        }
        
        return {
            isValid,
            fields: results,
            errors: this.getFormErrors(results)
        };
    }
    
    /**
     * Obtém erros do formulário
     */
    getFormErrors(results) {
        const errors = [];
        
        for (const [fieldName, result] of Object.entries(results)) {
            if (!result.isValid) {
                errors.push({
                    field: fieldName,
                    errors: result.errors
                });
            }
        }
        
        return errors;
    }
    
    /**
     * Valida dados no servidor
     */
    async validateOnServer(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Validation-Request': 'true'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            return {
                isValid: response.ok && result.valid !== false,
                errors: result.errors || [],
                serverResponse: result
            };
            
        } catch (error) {
            console.error('Erro na validação do servidor:', error);
            return {
                isValid: false,
                errors: ['Erro de conexão com o servidor'],
                serverResponse: null
            };
        }
    }
    
    /**
     * Validação dupla (client + server)
     */
    async validateDual(formData, rules, serverEndpoint) {
        // 1. Validação client-side
        const clientResult = this.validateForm(formData, rules);
        
        if (!clientResult.isValid) {
            return {
                isValid: false,
                clientErrors: clientResult.errors,
                serverErrors: [],
                source: 'client'
            };
        }
        
        // 2. Validação server-side
        const serverResult = await this.validateOnServer(serverEndpoint, formData);
        
        return {
            isValid: clientResult.isValid && serverResult.isValid,
            clientErrors: clientResult.errors,
            serverErrors: serverResult.errors,
            source: serverResult.isValid ? 'both' : 'server',
            serverResponse: serverResult.serverResponse
        };
    }
    
    /**
     * Configura validação em tempo real para formulário
     */
    setupRealTimeValidation(form, rules = null) {
        const formRules = rules || this.rules;
        
        // Validar campos individuais
        form.querySelectorAll('input, select, textarea').forEach(field => {
            const fieldName = field.name || field.id;
            const fieldRules = formRules.get(fieldName);
            
            if (!fieldRules) return;
            
            // Validação em tempo real
            field.addEventListener('blur', () => {
                this.validateAndShowErrors(field, fieldRules);
            });
            
            // Validação durante digitação (debounced)
            let timeout;
            field.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.validateAndShowErrors(field, fieldRules);
                }, 500);
            });
        });
        
        // Validação no submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Validação dupla se endpoint configurado
            const endpoint = form.dataset.validationEndpoint;
            let result;
            
            if (endpoint) {
                result = await this.validateDual(data, formRules, endpoint);
            } else {
                result = this.validateForm(data, formRules);
            }
            
            this.handleFormValidationResult(form, result);
        });
    }
    
    /**
     * Valida campo e mostra erros
     */
    validateAndShowErrors(field, rules) {
        const result = this.validateField(field.name || field.id, field.value, rules);
        
        // Remover erros anteriores
        this.clearFieldErrors(field);
        
        // Aplicar classes visuais
        if (result.isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            
            // Mostrar erros
            this.showFieldErrors(field, result.errors);
        }
        
        return result;
    }
    
    /**
     * Remove erros visuais do campo
     */
    clearFieldErrors(field) {
        const container = field.closest('.form-group') || field.parentElement;
        const existingErrors = container.querySelectorAll('.field-error');
        existingErrors.forEach(error => error.remove());
    }
    
    /**
     * Mostra erros do campo
     */
    showFieldErrors(field, errors) {
        const container = field.closest('.form-group') || field.parentElement;
        
        errors.forEach(error => {
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = error;
            errorElement.setAttribute('role', 'alert');
            
            container.appendChild(errorElement);
        });
    }
    
    /**
     * Trata resultado da validação do formulário
     */
    handleFormValidationResult(form, result) {
        if (result.isValid) {
            // Sucesso - prosseguir com submit
            this.handleSuccessfulValidation(form, result);
        } else {
            // Erro - mostrar problemas
            this.handleValidationErrors(form, result);
        }
    }
    
    /**
     * Trata validação bem-sucedida
     */
    handleSuccessfulValidation(form, result) {
        // Remover todos os erros visuais
        form.querySelectorAll('.field-error').forEach(error => error.remove());
        form.querySelectorAll('.invalid').forEach(field => {
            field.classList.remove('invalid');
            field.classList.add('valid');
        });
        
        // Disparar evento customizado
        form.dispatchEvent(new CustomEvent('validationSuccess', {
            detail: { result }
        }));
        
        console.log('✅ Validação bem-sucedida:', result);
    }
    
    /**
     * Trata erros de validação
     */
    handleValidationErrors(form, result) {
        // Mostrar erros client-side
        if (result.clientErrors) {
            result.clientErrors.forEach(({ field, errors }) => {
                const fieldElement = form.querySelector(`[name="${field}"], #${field}`);
                if (fieldElement) {
                    this.showFieldErrors(fieldElement, errors);
                    fieldElement.classList.add('invalid');
                    fieldElement.classList.remove('valid');
                }
            });
        }
        
        // Mostrar erros server-side
        if (result.serverErrors) {
            result.serverErrors.forEach(error => {
                if (error.field) {
                    const fieldElement = form.querySelector(`[name="${error.field}"], #${error.field}`);
                    if (fieldElement) {
                        this.showFieldErrors(fieldElement, [error.message]);
                        fieldElement.classList.add('invalid');
                        fieldElement.classList.remove('valid');
                    }
                } else {
                    // Erro geral do formulário
                    this.showFormError(form, error.message || error);
                }
            });
        }
        
        // Focar no primeiro campo com erro
        const firstError = form.querySelector('.invalid');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Disparar evento customizado
        form.dispatchEvent(new CustomEvent('validationError', {
            detail: { result }
        }));
        
        console.log('❌ Erros de validação:', result);
    }
    
    /**
     * Mostra erro geral do formulário
     */
    showFormError(form, message) {
        // Remover erro anterior
        const existingError = form.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Criar novo erro
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        // Inserir no topo do formulário
        form.insertBefore(errorElement, form.firstChild);
    }
    
    /**
     * Configurações pré-definidas para formulários comuns
     */
    getPresetRules(type) {
        const presets = {
            login: new Map([
                ['email', ['required', 'email']],
                ['senha', ['required', { type: 'minLength', min: 6 }]]
            ]),
            
            cadastro: new Map([
                ['nome', ['required', 'fullName']],
                ['email', ['required', 'email']],
                ['telefone', ['required', 'phone']],
                ['senha', ['required', 'strongPassword']],
                ['confirmar_senha', ['required', (value, formData) => {
                    return value === formData.senha || 'As senhas não coincidem';
                }]]
            ]),
            
            campanha: new Map([
                ['titulo', ['required', { type: 'minLength', min: 5 }]],
                ['descricao', ['required', { type: 'minLength', min: 20 }]],
                ['local', ['required']],
                ['data', ['required', 'futureDate']],
                ['hora', ['required', 'timeFormat']],
                ['tipoSanguineo', ['required', 'bloodType']],
                ['meta', ['required', 'positiveNumber']]
            ]),
            
            perfil: new Map([
                ['nome', ['required', 'fullName']],
                ['email', ['required', 'email']],
                ['telefone', ['phone']],
                ['dataNascimento', ['adultAge']]
            ])
        };
        
        return presets[type] || new Map();
    }
    
    /**
     * Inicializa validação automática em formulários
     */
    autoInit() {
        document.querySelectorAll('form[data-validation]').forEach(form => {
            const validationType = form.dataset.validation;
            const rules = this.getPresetRules(validationType);
            
            if (rules.size > 0) {
                this.setupRealTimeValidation(form, rules);
                console.log(`🔍 Validação automática configurada para formulário: ${validationType}`);
            }
        });
    }
}

// Instância global
window.validationSystem = new ValidationSystem();

// Auto-inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.validationSystem.autoInit();
});

console.log('🔍 Sistema de validação dupla carregado!');
