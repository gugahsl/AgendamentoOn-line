/**
 * AgendaSys — app.js
 *
 * Ponto de entrada da aplicação.
 * Inicializa todos os módulos após o DOM estar pronto.
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token'); // Use 'token', que é o que seu AuthModule salva

    if (!token) {
        console.warn("Usuário não autenticado. Redirecionando...");
        window.location.href = 'login.html';
        return; // Para a execução aqui e não chama as APIs abaixo
    }

    // 1. Inicializa utilitários de UI (modais, toasts, etc.)
    UI.init();
    // Pequeno atraso (0ms ou 10ms) para garantir que o DOM está "pintado"
    setTimeout(async () => {
      try {
          // Primeiro, buscamos os dados
          await DashboardModule.init();
          
          // Depois, mostramos a página
          UI.showPage('dashboard');
          
          // Inicializa o restante em segundo plano
          AgendamentosModule.init();
          ClientesModule.init();
          SalasModule.init();
          BloqueiosModule.init();
          
          console.info('[AgendaSys] Dashboard carregado com sucesso.');
      } catch (err) {
          console.error("Falha na inicialização:", err);
      }
  }, 50);
  });