/**
 * AgendaSys — AuthModule
 * Gerencia Login e Cadastro de Usuários
 */
const AuthModule = (() => {
    
    const selectors = {
        get formLogin() { return document.getElementById('loginForm') || document.querySelector('.login-form'); },
        get btnSubmit() { return document.querySelector('.btn-login'); }
    };

    async function handleLogin(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
    
        if (!emailInput || !passwordInput) return;
    
        const email = emailInput.value;
        const password = passwordInput.value;
    
        try {
            // Usando o seletor atualizado para o botão
            UI.setButtonLoading(selectors.btnSubmit, true);
            
            console.log("Iniciando tentativa de login...");
            const data = await API.Usuarios.login({ email, password });
            
            // Lógica flexível para o token
            const token = (data && data.token) ? data.token : data;
    
            if (token && typeof token === 'string') {
                localStorage.setItem('token', token);
                console.log("Token armazenado com sucesso.");
                if (data.user) {
                    localStorage.setItem('userName', data.user.nome || "Usuário");
                    localStorage.setItem('userRole', data.user.role || "Administrador");
                } else {
                    // Caso a API não envie o objeto user, tentamos buscar um nome genérico
                    // ou você pode definir um padrão baseado no email
                    const fallbackName = email.split('@')[0]; 
                    localStorage.setItem('userName', fallbackName);
                }
    
                console.log("Token e dados de perfil armazenados.");
                // Redirecionamento
                window.location.href = 'index.html';
            } else {
                console.error("Resposta inesperada do servidor:", data);
                throw new Error("Não foi possível extrair o token de acesso.");
            }
            
        } catch (error) {
            console.error("Erro capturado no handleLogin:", error);
            UI.handleApiError(error, 'Falha na autenticação. Verifique e-mail e senha.');
        } finally {
            UI.setButtonLoading(selectors.btnSubmit, false);
        }
    }

    async function handleCadastro(e) {
        e.preventDefault();
        const dados = {
            nome: document.getElementById('nome').value,
            sobrenome: document.getElementById('sobrenome').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            UI.setButtonLoading(selectors.btnSubmit, true);
            await API.Usuarios.cadastrar(dados);
            UI.showToast('Conta criada com sucesso!', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (error) {
            UI.handleApiError(error);
        } finally {
            UI.setButtonLoading(selectors.btnSubmit, false);
        }
    }

    function initLogin() {
        const form = selectors.formLogin;
        if (!form) {
            console.warn("Formulário de login não encontrado.");
            return;
        }
        form.addEventListener('submit', handleLogin);
    }

    function initCadastro() {
        const form = selectors.formLogin; 
        if (!form) return;
        form.addEventListener('submit', handleCadastro);
    }

    return {
        initLogin,
        initCadastro
    };
})();