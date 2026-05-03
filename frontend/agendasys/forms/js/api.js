/**
 * AgendaSys — API Service
 *
 * Camada de comunicação com o back-end Java (Spring Boot).
 * Centraliza todas as chamadas HTTP, tratamento de erros e interceptors.
 *
 * Base URL configurável via constante BASE_URL.
 * Todas as funções retornam Promises e lançam ApiError em caso de falha.
 */

const API = (() => {

    // ---- Configuração ----
    const BASE_URL = 'http://localhost:8080/api'; // Ajuste conforme seu servidor Java
  
    /**
     * Recupera o token JWT do localStorage (se autenticação for implementada).
     * Ajuste conforme sua estratégia de autenticação.
     */
    const getToken = () => localStorage.getItem('token');
  
    // ---- Classe de erro da API ----
    class ApiError extends Error {
      constructor(status, message, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
      }
    }
  
    // ---- Método HTTP genérico ----
    async function request(method, path, body = null) {
      const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      };
  
      const token = getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token.trim()}`; // O trim() evita espaços em branco acidentais
    }
  
      const config = { method, headers };
      if (body) config.body = JSON.stringify(body);
  
      try {
          const response = await fetch(`${BASE_URL}${path}`, config);
  
          // 1. Trata 204 No Content
          if (response.status === 204) return null;
  
          // 2. Tenta ler como texto para não quebrar se o Java retornar String pura
          const text = await response.text();
          let data;
          try {
              data = text ? JSON.parse(text) : {};
          } catch (e) {
              data = text; // Se não for JSON, mantém como texto (útil para tokens puros)
          }
  
          // 3. Interceptador de Autenticação (401/403)
          if (response.status === 401 || response.status === 403) {
            // SÓ redireciona se NÃO for uma tentativa de login
            if (!path.includes('/usuarios/login')) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
        }
  
          // 4. Se a resposta não for OK, lança o erro customizado
          if (!response.ok) {
              throw new ApiError(
                  response.status,
                  (data && data.message) ? data.message : `Erro ${response.status}`,
                  data
              );
          }
  
          return data;
      } catch (error) {
          console.error('[API DEBUG]:', error);
          if (error instanceof ApiError) throw error;
          throw new ApiError(0, 'Falha na comunicação com o servidor.');
      }
  }
  
    const get    = (path)         => request('GET',    path);
    const post   = (path, body)   => request('POST',   path, body);
    const put    = (path, body)   => request('PUT',    path, body);
    const del    = (path)         => request('DELETE', path);
  
    // =========================================================
// AGENDAMENTOS  →  /api/agendamentos
// =========================================================
const Agendamentos = {
    /** * Lista agendamentos com filtros opcionais.
     * Ajustado para os nomes dos parâmetros no Controller Java
     */
    // No seu api.js, dentro do objeto Agendamentos
    listar: (params = {}) => {
      // Se não houver parâmetros, não envia a interrogação (?) nem parâmetros vazios
      if (Object.keys(params).length === 0) {
          return get('/agendamentos');
      }
      
      const query = new URLSearchParams(params).toString();
      return get(`/agendamentos?${query}`);
    },

    /** Busca agendamento por ID */
    buscarPorId: (id) => get(`/agendamentos/${id}`),

    /** * Cria novo agendamento
     * O objeto 'agendamento' deve conter: salaId, clienteId, dataHoraInicio, dataHoraFim...
     */
    criar: (agendamento) => post('/agendamentos', agendamento),

    /** * Atualiza agendamento existente
     * Nota: No seu Controller, o @PutMapping não recebe ID na URL, 
     * mas sim dentro do corpo (AgendamentoParaAtualizarRequest).
     */
    atualizar: (agendamento) => put(`/agendamentos`, agendamento),

    /** Remove agendamento */
    remover: (id) => del(`/agendamentos/${id}`),

    /** * Atalho para buscar por sala e data (ajustado para os nomes do Java)
     */
    porSalaEData: (salaId, dataHoraInicio, dataHoraFim) =>
      get(`/agendamentos?salaId=${salaId}&dataHoraInicio=${dataHoraInicio}&dataHoraFim=${dataHoraFim}`),
  };
  
    // =========================================================
    // CLIENTES  →  /api/clientes
    // =========================================================
    const Clientes = {
      /** Lista todos os clientes, com busca opcional.
       *  @param {Object} params - { search, page, size }
       */
      listar: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return get(`/clientes${query ? '?' + query : ''}`);
      },
  
      buscarPorId: (id) => get(`/clientes/${id}`),
  
      /** Cria novo cliente
       *  @param {Object} cliente - { nome, email, telefone, observacoes }
       */
      criar: (cliente) => post('/clientes', cliente),
  
      atualizar: (cliente) => put(`/clientes`, cliente),
  
      remover: (id) => del(`/clientes/${id}`),
    };
  
    // =========================================================
    // SALAS (ESPAÇOS)  →  /api/salas
    // =========================================================
    const Salas = {
      /** * Lista todas as salas.
       * Mapeia para o @GetMapping do SalaController
       */
      listar: () => get('/salas'),

      /** * Busca por ID.
       * Mapeia para o @GetMapping("/{id}")
       */
      buscarPorId: (id) => get(`/salas/${id}`),

      /** * Cria nova sala.
       * Mapeia para o @PostMapping
       */
      criar: (payload) => post('/salas', payload),

      /** * Atualiza sala.
       * Mapeia para o @PutMapping. 
       * Nota: Como seu Java recebe o ID no corpo (SalaParaAtualizarRequest),
       * garantimos que o payload contenha o ID.
       */
      atualizar: (id, payload) => {
        // IMPORTANTE: Criamos um novo objeto que junta o ID com o restante dos dados
        const objetoCompleto = { 
            ...payload, 
            id: Number(id) 
        };
        
        // O segundo parâmetro do put deve ser esse objeto, 
        // para que ele vire o Body da requisição.
        return put('/salas', objetoCompleto); 
    },

      /** * Remove sala.
       * Mapeia para o @DeleteMapping("/{id}")
       */
      remover: (id) => del(`/salas/${id}`),
    };
  
    // =========================================================
    // BLOQUEIOS  →  /api/bloqueios
    // =========================================================
    const Bloqueios = {
      listar: async (filtros = {}) => {
        const limpo = {};
        
        Object.keys(filtros).forEach(key => {
          if (filtros[key]) limpo[key] = filtros[key];
        });
      
        const query = new URLSearchParams(limpo).toString();
        // USANDO o get() que já tem a BASE_URL configurada
        return get(`/bloqueios${query ? `?${query}` : ''}`);
      },
      
      criar: (payload) => post('/bloqueios', payload),
      
      remover: (id) => del(`/bloqueios/${id}`)
    };
  
    // =========================================================
    // LEMBRETES  →  /api/lembretes
    // =========================================================
    const Lembretes = {
      /** Retorna as configurações de lembrete automático */
      obterConfig: () => get('/lembretes/configuracao'),
  
      /** Salva configurações de lembrete automático
       *  @param {Object} config - { ativo, horasAntecedencia, enviarEmail, enviarSms }
       */
      salvarConfig: (config) => put('/lembretes/configuracao', config),
  
      /** Dispara envio manual de lembrete para um agendamento */
      enviarManual: (agendamentoId) =>
        post(`/lembretes/enviar/${agendamentoId}`),
    };
  
    // =========================================================
    // DASHBOARD  →  /api/dashboard
    // =========================================================
    const Dashboard = {
      getResumo: () => get('/dashboard/resumo')
    };
  
    // =========================================================
    // USUÁRIOS & AUTH  →  /api/usuarios
    // =========================================================
    const Usuarios = {
      login: (credenciais) => post('/usuarios/login', credenciais),
      cadastrar: (dados) => post('/usuarios/cadastrar', dados),
    };

    
  
    // ---- Expõe a API pública ----
    return {
      Agendamentos,
      Clientes,
      Salas,
      Bloqueios,
      Lembretes,
      Dashboard,
      Usuarios,
      ApiError,
    };
  
  })();