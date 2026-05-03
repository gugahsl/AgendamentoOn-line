/**
 * AgendaSys — UI Utilities
 *
 * Funções utilitárias para:
 *  - Navegação entre páginas (SPA)
 *  - Abertura/fechamento de modais
 *  - Notificações (toast)
 *  - Formatação de dados
 *  - Estados de loading
 */

const UI = (() => {

    // ---- Mapeamento de páginas ----
    const PAGE_NAMES = {
      dashboard:    'Dashboard',
      agenda:       'Agenda',
      agendamentos: 'Agendamentos',
      clientes:     'Clientes',
      espacos:      'Espaços',
      bloqueios:    'Horários Bloqueados',
      lembretes:    'Lembretes',
    };

    /**
     * Busca os dados do localStorage e atualiza a interface da Sidebar.
     */
    function renderUserData() {
      const name = localStorage.getItem('userName') || "Usuário";
      const role = localStorage.getItem('userRole') || "Administrador";
      
      const nameEl = document.getElementById('user-name-display');
      const roleEl = document.getElementById('user-role-display');
      const avatarEl = document.getElementById('user-avatar-initials');

      if (nameEl) nameEl.textContent = name;
      if (roleEl) roleEl.textContent = role;
      
      if (avatarEl) {
          // Pega as iniciais (ex: "Adriano De" -> "AD")
          const initials = name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
          avatarEl.textContent = initials;
      }
  }
  
    // =========================================================
    // NAVEGAÇÃO
    // =========================================================
  
    /**
     * Exibe a página solicitada e atualiza sidebar e topbar.
     * @param {string} pageId - ID da página (sem o prefixo "page-")
     */
    function showPage(pageId) {
      console.log(`[UI] Tentando exibir página: ${pageId}`);

      // 1. Oculta todas as páginas primeiro
      const pages = document.querySelectorAll('.page');
      pages.forEach(p => {
          p.classList.remove('active');
          p.style.display = 'none'; // Forçamos o sumiço total
      });
    
      // 2. Identifica a página alvo
      const target = document.getElementById(`page-${pageId}`);
      if (!target) {
          console.warn(`[UI] Página não encontrada: page-${pageId}`);
          return;
      }

      // 3. Força a exibição visual ANTES de carregar os dados
      target.style.display = 'block';
      
      // Usamos um pequeno delay (tick) para garantir que o navegador processou o 'display: block'
      setTimeout(() => {
          target.classList.add('active');

          // 4. Lógica específica para o Dashboard
          if (pageId === 'dashboard') {
              if (typeof DashboardModule !== 'undefined') {
                  console.log("[UI] Disparando init do Dashboard");
                  DashboardModule.init();
              }
          }

          // 5. Atualiza estado da sidebar
          document.querySelectorAll('.nav-item').forEach(item => {
              item.classList.remove('active');
              const onclick = item.getAttribute('onclick') || '';
              if (onclick.includes(`'${pageId}'`)) {
                  item.classList.add('active');
              }
          });

          // 6. Atualiza título da topbar
          const title = document.getElementById('topbarTitle');
          if (title) title.textContent = PAGE_NAMES[pageId] || pageId;

          // 7. Dispara evento customizado
          document.dispatchEvent(new CustomEvent('pageChanged', { detail: { pageId } }));
          
          window.scrollTo(0, 0);
      }, 10); // 10 milissegundos são suficientes para o navegador "acordar"
  }
  
    // =========================================================
    // MODAIS
    // =========================================================
  
    /** Abre um modal pelo ID do backdrop */
    function openModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.add('open');
    }
  
    /** Fecha um modal pelo ID do backdrop */
    function closeModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.remove('open');
    }
  
    /** Fecha o modal ao clicar no backdrop (fora do conteúdo) */
    function initModalBackdrops() {
      document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            backdrop.classList.remove('open');
          }
        });
      });
    }
  
    // =========================================================
    // TOAST NOTIFICATIONS
    // =========================================================
  
    let toastContainer = null;
  
    function getToastContainer() {
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
      }
      return toastContainer;
    }
  
    /**
     * Exibe uma notificação toast.
     * @param {string} message - Mensagem a exibir
     * @param {'success'|'error'|'info'|'warning'} type - Tipo do toast
     * @param {number} duration - Duração em ms (padrão: 3500)
     */
    function showToast(message, type = 'info', duration = 3500) {
      const colors = {
        success: { bg: 'var(--teal-50)',  border: 'var(--teal-400)',  text: 'var(--teal-800)',  icon: '✓' },
        error:   { bg: 'var(--red-50)',   border: 'var(--red-400)',   text: 'var(--red-600)',   icon: '✕' },
        warning: { bg: 'var(--amber-50)', border: 'var(--amber-400)', text: 'var(--amber-600)', icon: '!' },
        info:    { bg: 'var(--blue-50)',  border: 'var(--blue-400)',  text: 'var(--blue-800)',  icon: 'i' },
      };
      const c = colors[type] || colors.info;
  
      const toast = document.createElement('div');
      toast.style.cssText = `
        display: flex; align-items: center; gap: 10px;
        padding: 12px 16px;
        background: ${c.bg};
        border: 0.5px solid ${c.border};
        border-radius: 8px;
        font-size: 13px;
        color: ${c.text};
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        animation: slideIn 0.2s ease;
        max-width: 320px;
      `;
      toast.innerHTML = `
        <span style="font-weight:600;flex-shrink:0">${c.icon}</span>
        <span>${message}</span>
      `;
  
      // Inject animation keyframe once
      if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
          @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
          @keyframes slideOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(20px); } }
        `;
        document.head.appendChild(style);
      }
  
      getToastContainer().appendChild(toast);
  
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.2s ease forwards';
        setTimeout(() => toast.remove(), 200);
      }, duration);
    }
  
    // =========================================================
    // LOADING STATE
    // =========================================================
  
    /**
     * Exibe/oculta estado de loading em um container.
     * @param {string|HTMLElement} target - Selector ou elemento
     * @param {boolean} show
     * @param {string} message - Mensagem opcional
     */
    function setLoading(target, show, message = 'Carregando...') {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
  
      if (show) {
        el.dataset.originalContent = el.innerHTML;
        el.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;padding:40px;gap:10px;color:var(--color-text-tertiary)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              style="animation:spin 1s linear infinite">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3"/>
              <path d="M21 12a9 9 0 01-9 9"/>
            </svg>
            <span style="font-size:13px">${message}</span>
          </div>
        `;
        if (!document.getElementById('spin-style')) {
          const s = document.createElement('style');
          s.id = 'spin-style';
          s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
          document.head.appendChild(s);
        }
      } else {
        if (el.dataset.originalContent !== undefined) {
          el.innerHTML = el.dataset.originalContent;
          delete el.dataset.originalContent;
        }
      }
    }
  
    /**
     * Desabilita/habilita um botão e mostra estado de salvando.
     * @param {HTMLButtonElement} btn
     * @param {boolean} loading
     */
    function setButtonLoading(btn, loading) {
      if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Salvando...';
      } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || btn.textContent;
      }
    }
  
    // =========================================================
    // FORMATAÇÃO
    // =========================================================
  
    /**
     * Formata uma data ISO para exibição local (dd/MM/yyyy HH:mm).
     * @param {string} isoString - Data no formato ISO 8601
     * @returns {string}
     */
    function formatDateTime(isoString) {
      if (!isoString) return '—';
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  
    /**
     * Formata apenas a hora.
     * @param {string} isoString
     * @returns {string}
     */
    function formatTime(isoString) {
      if (!isoString) return '—';
      return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  
    /**
     * Formata data YYYY-MM-DD para dd/MM/yyyy.
     * @param {string} dateStr
     * @returns {string}
     */
    function formatDate(dateStr) {
      if (!dateStr) return '—';
      const data = new Date(dateStr);
      dateStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      return dateStr
    }
  
    /**
     * Trunca texto para exibição em tabelas.
     * @param {string} text
     * @param {number} maxLen
     * @returns {string}
     */
    function truncate(text, maxLen = 40) {
      if (!text) return '—';
      return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
    }
  
    // =========================================================
    // TRATAMENTO DE ERROS DA API
    // =========================================================
  
    /**
     * Trata erros da API de forma padronizada, exibindo toast.
     * @param {Error} error - Erro capturado no catch
     * @param {string} fallbackMessage - Mensagem padrão se não houver erro da API
     */
    function handleApiError(error, fallbackMessage = 'Ocorreu um erro inesperado.') {
      console.error('[API Error]', error);
      const message = error?.message || fallbackMessage;
      showToast(message, 'error');
    }
  
    // =========================================================
    // CONFIRMAÇÃO
    // =========================================================
  
    /**
     * Cria um dialog de confirmação simples (nativo do browser).
     * Para uma versão customizada, substitua por um modal dedicado.
     * @param {string} message
     * @returns {boolean}
     */
    function confirm(message) {
      return window.confirm(message);
    }
  
    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================
  
    function init() {
      initModalBackdrops();
      renderUserData();
    }
  
    // ---- Expõe API pública ----
    return {
      showPage,
      openModal,
      closeModal,
      showToast,
      setLoading,
      setButtonLoading,
      formatDateTime,
      formatTime,
      formatDate,
      truncate,
      handleApiError,
      confirm,
      renderUserData,
      init,
    };
  
  })();