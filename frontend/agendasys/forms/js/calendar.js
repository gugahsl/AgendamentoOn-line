/**
 * AgendaSys — Módulo: Calendário
 *
 * Gerencia a renderização e interação do calendário mensal na página Agenda.
 * Integra com API.Agendamentos para buscar eventos do mês.
 */

const CalendarModule = (() => {

    // Estado interno do calendário
    let currentYear  = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0-indexed
    let events = []; // Cache de agendamentos do mês atual
  
    const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const MONTHS = [
      'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
    ];
  
    // ---- Helpers ----
  
    function toDateStr(y, m, d) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  
    function isToday(y, m, d) {
      const now = new Date();
      return y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
    }
  
    /**
     * Agrupa eventos por data (YYYY-MM-DD).
     * Espera que cada agendamento tenha { dataInicio: 'YYYY-MM-DDThh:mm', cor, titulo }.
     */
    function groupEventsByDate(agendamentos) {
      const map = {};
      agendamentos.forEach(ag => {
        const dateKey = ag.dataInicio?.split('T')[0];
        if (!dateKey) return;
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(ag);
      });
      return map;
    }
  
    // ---- Renderização ----
  
    function renderCalendar() {
      updateHeader();
      renderDays();
    }
  
    function updateHeader() {
      const el = document.querySelector('.cal-month');
      if (el) el.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
    }
  
    function renderDays() {
      const grid = document.getElementById('calDays');
      if (!grid) return;
  
      const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth    = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysInPrev     = new Date(currentYear, currentMonth, 0).getDate();
      const eventMap       = groupEventsByDate(events);
  
      let html = '';
  
      // Dias do mês anterior (preenchimento)
      for (let i = 0; i < firstDayOfWeek; i++) {
        const d = daysInPrev - firstDayOfWeek + i + 1;
        html += renderDay(d, true, false, []);
      }
  
      // Dias do mês atual
      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey    = toDateStr(currentYear, currentMonth, d);
        const dayEvents  = eventMap[dateKey] || [];
        const today      = isToday(currentYear, currentMonth, d);
        html += renderDay(d, false, today, dayEvents, dateKey);
      }
  
      // Completar grid até 42 células
      const totalCells = firstDayOfWeek + daysInMonth;
      const remaining  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let d = 1; d <= remaining; d++) {
        html += renderDay(d, true, false, []);
      }
  
      grid.innerHTML = html;
  
      // Event listeners para dias
      grid.querySelectorAll('.cal-day:not(.other-month)').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
          const date = dayEl.dataset.date;
          if (date) onDayClick(date, dayEl);
        });
      });
    }
  
    function renderDay(d, otherMonth, today, dayEvents, dateKey = '') {
      const classes = ['cal-day'];
      if (otherMonth) classes.push('other-month');
      if (today) classes.push('today');
  
      const numEl = `<div class="day-num">${d}</div>`;
      const visibleEvents = dayEvents.slice(0, 2);
      const overflow = dayEvents.length - 2;
  
      const eventsHtml = visibleEvents.map(ev => {
        const cor = ev.cor || '#3B82F6';
        return `<div class="cal-event" style="background:${cor}22;color:${cor}">${ev.titulo}</div>`;
      }).join('');
  
      const overflowHtml = overflow > 0
        ? `<div style="font-size:9px;color:var(--color-text-tertiary)">+${overflow}</div>`
        : '';
  
      return `
        <div class="${classes.join(' ')}" data-date="${dateKey}">
          ${numEl}
          ${eventsHtml}
          ${overflowHtml}
        </div>
      `;
    }
  
    // ---- Navegação ----
  
    function prevMonth() {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      loadAndRender();
    }
  
    function nextMonth() {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      loadAndRender();
    }
  
    // ---- Interação ----
  
    function onDayClick(date, dayEl) {
      // Remove seleção anterior
      document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
      dayEl.classList.add('selected');
  
      // Atualiza sidebar com os eventos do dia clicado
      const dayEvents = groupEventsByDate(events)[date] || [];
      updateSidebar(date, dayEvents);
  
      // Dispara evento para outros módulos
      document.dispatchEvent(new CustomEvent('calendarDaySelected', { detail: { date, events: dayEvents } }));
    }
  
    function updateSidebar(date, dayEvents) {
      const sidebar = document.querySelector('.cal-sidebar .card-header .card-title');
      if (sidebar) {
        const d = new Date(date + 'T12:00:00');
        sidebar.textContent = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
      }
  
      const body = document.querySelector('.cal-sidebar .card-body');
      if (!body) return;
  
      if (dayEvents.length === 0) {
        body.innerHTML = '<p style="font-size:13px;color:var(--color-text-tertiary);text-align:center;padding:16px 0">Nenhum agendamento</p>';
        return;
      }
  
      body.innerHTML = dayEvents.map(ev => `
        <div class="upcoming-item">
          <div class="upcoming-time">${UI.formatTime(ev.dataInicio)}</div>
          <div class="upcoming-info">
            <div class="upcoming-title">${ev.titulo}</div>
            <div class="upcoming-meta">${ev.clienteNome || ''} · ${ev.espacoNome || ''}</div>
          </div>
        </div>
      `).join('');
    }
  
    // ---- Carga de dados ----
  
    async function loadAndRender() {
      const dataInicio = toDateStr(currentYear, currentMonth, 1);
      const dataFim    = toDateStr(currentYear, currentMonth + 1, 0);
  
      // Demonstração com dados estáticos — substitua pela chamada real:
      // events = await API.Agendamentos.listar({ dataInicio, dataFim });
      events = MOCK_EVENTS; // Remova quando integrar com o back-end
  
      renderCalendar();
    }
  
    // ---- Dados de demonstração (remover ao integrar com back-end) ----
    const today = new Date();
    const MOCK_EVENTS = [
      { titulo: 'Consulta',    dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-05T09:00`, cor: '#3B82F6', clienteNome: 'João Silva',  espacoNome: 'Sala 01' },
      { titulo: 'Reunião',     dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-05T10:30`, cor: '#D85A30', clienteNome: 'Maria Santos',espacoNome: 'Sala 02' },
      { titulo: 'Workshop',    dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-10T09:00`, cor: '#1D9E75', clienteNome: 'Carlos Lima', espacoNome: 'Auditório' },
      { titulo: 'Avaliação',   dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-15T14:00`, cor: '#BA7517', clienteNome: 'Pedro Alves', espacoNome: 'Sala Reunião' },
      { titulo: 'Yoga',        dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-15T08:00`, cor: '#993C1D', clienteNome: 'Ana Costa',   espacoNome: 'Auditório' },
      { titulo: 'Treinamento', dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-20T16:00`, cor: '#185FA5', clienteNome: 'Ana Costa',   espacoNome: 'Sala 01' },
      { titulo: 'Reunião',     dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}T10:30`, cor: '#D85A30', clienteNome: 'Maria Santos', espacoNome: 'Sala 02' },
      { titulo: 'Consulta',    dataInicio: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}T09:00`, cor: '#3B82F6', clienteNome: 'João Silva',  espacoNome: 'Sala 01' },
    ];
  
    // ---- Init ----
  
    function init() {
      // Botões de navegação do calendário
      const prevBtn = document.querySelector('.cal-nav-btn:first-child');
      const nextBtn = document.querySelector('.cal-nav-btn:last-child');
      if (prevBtn) prevBtn.addEventListener('click', prevMonth);
      if (nextBtn) nextBtn.addEventListener('click', nextMonth);
  
      // Carrega ao exibir a página da agenda
      document.addEventListener('pageChanged', ({ detail }) => {
        if (detail.pageId === 'agenda') loadAndRender();
      });
  
      // Carrega imediatamente se já estiver na agenda
      if (document.getElementById('page-agenda')?.classList.contains('active')) {
        loadAndRender();
      }
    }
  
    return { init, loadAndRender, prevMonth, nextMonth };
  
  })();