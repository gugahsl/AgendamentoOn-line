const AgendamentosModule = (() => {
  let editingId = null;
  

  async function loadTabela(filtros = {}) {
    try {
      console.log("Chamando API com filtros:", filtros);
      const agendamentos = await API.Agendamentos.listar(filtros);
      const tbody = document.getElementById('tbody-agendamentos');
      if (!tbody) return;
      
      tbody.innerHTML = '';

      // Ajuste na lógica do estado vazio para ser mais segura
      const emptyState = document.getElementById('empty-state-agendamentos');
      if (emptyState) { // O 'if' garante que só execute se o elemento existir
        emptyState.style.display = agendamentos.length === 0 ? 'block' : 'none';
      }

      agendamentos.forEach(ag => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 500">${ag.titulo}</td>
          <td>${ag.cliente?.nome || 'N/A'}</td>
          <td>
            <span class="space-dot" style="background: ${ag.cor || '#3b82f6'}"></span>
            ${ag.sala?.nome || 'N/A'}
          </td>
          <td>${UI.formatDateTime(ag.dataHoraInicio)}</td>
          <td>${UI.formatDateTime(ag.dataHoraFim)}</td>
          <td><span class="badge badge-${ag.status.toLowerCase()}">${ag.status}</span></td>
          <td>
            <button class="btn" style="padding: 4px 10px; font-size: 12px" onclick="AgendamentosModule.openEdit(${ag.id})">Editar</button>
            <button class="btn" style="padding: 4px 10px; font-size: 12px; background: #fee2e2; color: #991b1b" onclick="AgendamentosModule.excluir(${ag.id})">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error("Erro no loadTabela:", error);
      UI.handleApiError(error, 'Erro ao carregar agendamentos.');
    }
  }

  // Captura os valores dos inputs de filtro da sua imagem
  function aplicarFiltros() {
    const inputBusca = document.getElementById('search-agendamentos');
    const selectStatus = document.getElementById('filter-status');
    const selectEspaco = document.getElementById('filter-espaco');

    const filtros = {
        titulo: inputBusca?.value?.trim() || null,
        status: selectStatus?.value || null,
        salaId: selectEspaco?.value || null
    };

    Object.keys(filtros).forEach(key => (filtros[key] === null || filtros[key] === "") && delete filtros[key]);

    // Chama a função local diretamente
    loadTabela(filtros);
  }

  async function openNew() {
    editingId = null;
    resetForm();
    await loadSelects(); // Importante: carrega os dados antes de mostrar o modal
    
    document.getElementById('modalAgendamentoTitle').textContent = 'Novo Agendamento';
    
    const statusSelect = document.getElementById('ag-status');
    if (statusSelect) {
      statusSelect.value = 'AGENDADO';
      statusSelect.disabled = true; // Sempre começa agendado
    }
    UI.openModal('modalAgendamento');
  }

  async function openEdit(id) {
    console.log("Editando ID:", id);
    
    // PRIMEIRO resetamos, DEPOIS atribuímos o ID
    resetForm(); 
    editingId = id; 
    
    await loadSelects();
    
    document.getElementById('modalAgendamentoTitle').textContent = 'Editar Agendamento';
    
    try {
        const ag = await API.Agendamentos.buscarPorId(id);
        if (ag) {
            document.getElementById('ag-titulo').value = ag.titulo;
            document.getElementById('ag-cliente').value = ag.cliente?.id || "";
            document.getElementById('ag-espaco').value = ag.sala?.id || "";
            
            // Correção das datas: o input datetime-local precisa do formato yyyy-MM-ddThh:mm
            if (ag.dataHoraInicio) {
                document.getElementById('ag-inicio').value = ag.dataHoraInicio.substring(0, 16);
            }
            if (ag.dataHoraFim) {
                document.getElementById('ag-fim').value = ag.dataHoraFim.substring(0, 16);
            }

            document.getElementById('ag-cor').value = ag.cor || "#3b82f6";
            document.getElementById('ag-descricao').value = ag.descricao || '';
            
            const statusSelect = document.getElementById('ag-status');
            if (statusSelect) {
                statusSelect.value = ag.status;
                statusSelect.disabled = false; 
            }
        }
        UI.openModal('modalAgendamento');
    } catch (error) {
        UI.handleApiError(error);
    }
  }

  async function salvar() {
    const rawData = getFormData();
    if (!validateForm(rawData)) return;
  
    const saveBtn = document.getElementById('btnSalvarAgendamento');
    UI.setButtonLoading(saveBtn, true);
  
    try {
      if (editingId) {
        // Criamos o payload garantindo que o ID seja o que queremos
        const payload = { 
          ...rawData,
          id: Number(editingId) // O ID do agendamento entra por último para sobrescrever qualquer erro
        };
        
        console.log("JSON FINAL ENVIADO:", JSON.stringify(payload)); 
        
        await API.Agendamentos.atualizar(payload);
        UI.showToast('Agendamento atualizado!', 'success');
      } else {
        await API.Agendamentos.criar(rawData);
        UI.showToast('Agendamento criado!', 'success');
      }
      
      UI.closeModal('modalAgendamento');
      await loadTabela(); 
    } catch (error) {
      UI.handleApiError(error);
    } finally {
      UI.setButtonLoading(saveBtn, false);
    }
  }

  function getFormData() {
    return {
      titulo: document.getElementById('ag-titulo')?.value?.trim(),
      clienteId: Number(document.getElementById('ag-cliente')?.value),
      salaId: Number(document.getElementById('ag-espaco')?.value), 
      dataHoraInicio: document.getElementById('ag-inicio')?.value,
      dataHoraFim: document.getElementById('ag-fim')?.value,
      cor: document.getElementById('ag-cor')?.value,
      descricao: document.getElementById('ag-descricao')?.value?.trim(),
      status: document.getElementById('ag-status')?.value
    };
  }

  function validateForm(d) {
    if (!d.titulo) { UI.showToast('Título é obrigatório', 'warning'); return false; }
    if (!d.clienteId) { UI.showToast('Selecione um cliente', 'warning'); return false; }
    if (!d.salaId) { UI.showToast('Selecione um espaço', 'warning'); return false; }
    if (!d.dataHoraInicio || !d.dataHoraFim) { UI.showToast('Datas são obrigatórias', 'warning'); return false; }
    return true;
  }

  async function loadSelects() {
    try {
        const [clientes, salas] = await Promise.all([
            API.Clientes.listar(),
            API.Salas.listar()
        ]);
        
        populateSelect('ag-cliente', clientes, c => ({ value: c.id, label: c.nome }));
        populateSelect('ag-espaco', salas, s => ({ value: s.id, label: s.nome }));
        populateSelect('filter-espaco', salas, s => ({ value: s.id, label: s.nome }));
        
    } catch (error) {
        console.error("Erro ao carregar selects:", error);
    }
  }

  function populateSelect(id, items, mapFn) {
    const s = document.getElementById(id);
    if (!s) return;
    const firstOpt = s.options[0];
    s.innerHTML = '';
    if (firstOpt) s.appendChild(firstOpt);
    items.forEach(i => {
      const { value, label } = mapFn(i);
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      s.appendChild(opt);
    });
  }

  // Melhorei o resetForm para ser usado com segurança
  function resetForm() {
    const f = document.getElementById('formAgendamento');
    if (f) f.reset();
    editingId = null; // Ele limpa o ID, por isso deve ser chamado no INÍCIO do openEdit
  }

  async function excluir(id) {
    if (!UI.confirm('Deseja excluir este agendamento?')) return;
    try {
      await API.Agendamentos.remover(id);
      UI.showToast('Removido com sucesso');
      loadTabela();
    } catch (error) {
      UI.handleApiError(error);
    }
  }

  function init() {
    const btn = document.getElementById('btnSalvarAgendamento');
    if (btn) btn.onclick = salvar;

    const inputBusca = document.getElementById('search-agendamentos');
    const selectStatus = document.getElementById('filter-status');
    const selectEspaco = document.getElementById('filter-espaco');

    // Debug para confirmar que os elementos foram encontrados
    console.log("Elementos de filtro encontrados:", { inputBusca, selectStatus, selectEspaco });

    let timeout;
    inputBusca?.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => aplicarFiltros(), 500);
    });

    selectStatus?.addEventListener('change', () => aplicarFiltros());
    selectEspaco?.addEventListener('change', () => aplicarFiltros());

    loadTabela();
    loadSelects(); 
  }

  return { init, openNew, openEdit, excluir, loadTabela, aplicarFiltros };
})();

document.addEventListener('DOMContentLoaded', () => {
  AgendamentosModule.init();
});