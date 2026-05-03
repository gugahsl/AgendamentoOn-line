/**
 * AgendaSys — Módulo: Espaços
 */

/**
 * AgendaSys — Módulo: Espaços
 */
const SalasModule = (() => {

  let editingId = null;
  let listaSalas = []; // Armazena a lista local para filtros ou buscas futuras

  function openNew() {
    editingId = null;
    resetForm();
    document.getElementById('modalEspacoTitle').textContent = 'Novo espaço';
    // Define uma cor padrão caso o usuário não escolha
    const corInput = document.getElementById('esp-cor');
    if (corInput) corInput.value = '#3B82F6';
    UI.openModal('modalEspaco');
  }

  async function openEdit(id) {
    editingId = id;
    document.getElementById('modalEspacoTitle').textContent = 'Editar espaço';
    
    try {
      const espaco = await API.Salas.buscarPorId(id);
      
      // Preenche o formulário com os dados vindos do Java
      const campos = {
          nome: document.getElementById('esp-nome'),
          capacidade: document.getElementById('esp-capacidade'),
          cor: document.getElementById('esp-cor'),
          ativo: document.getElementById('esp-ativo'),
          descricao: document.getElementById('esp-descricao')
      };

      if (campos.nome) campos.nome.value = espaco.nome || '';
      if (campos.capacidade) campos.capacidade.value = espaco.capacidade || '';
      if (campos.cor) campos.cor.value = espaco.cor || '#3B82F6';
      if (campos.ativo) campos.ativo.value = espaco.ativo ? 'Sim' : 'Não';
      if (campos.descricao) campos.descricao.value = espaco.descricao || '';

      UI.openModal('modalEspaco');
    } catch (error) {
      UI.handleApiError(error, 'Erro ao carregar dados do espaço.');
    }
  }

  function openDisponibilidade(id, nome) {
    const title = document.querySelector('#modalDisponibilidade .modal-title');
    if (title) title.textContent = `Disponibilidade — ${nome || 'Espaço'}`;
    UI.openModal('modalDisponibilidade');
    // Futuro: API.Salas.disponibilidade(id, data)
  }

  function resetForm() {
    const form = document.getElementById('formEspaco');
    if (form) form.reset();
  }

  // --- NOVA FUNÇÃO: Renderização dos Cards ---
  function renderizarCards(lista) {
    const container = document.querySelector('#page-espacos > div[style*="grid"]');
    if (!container) return;

    container.innerHTML = '';

    lista.forEach(espaco => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // CORREÇÃO 1: Garante que a borda pegue a cor do banco
        card.style.borderTop = `4px solid ${espaco.cor || '#3b82f6'}`;
        
       // ... dentro do loop listaSalas.forEach na função renderizarCards ...
        
       card.innerHTML = `
       <div class="card-body">
           <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
               <div>
                   <div style="font-size: 15px; font-weight: 600">${espaco.nome}</div>
                   <div style="font-size: 12px; color: var(--color-text-secondary);">
                       ${espaco.descricao || 'Sem descrição'}
                   </div>
               </div>
               <span class="badge ${espaco.ativo ? 'badge-confirmado' : 'badge-inativo'}">
                   ${espaco.ativo ? 'Ativo' : 'Inativo'}
               </span>
           </div>
           <div style="font-size: 13px; margin-bottom: 15px;">
               <strong>Capacidade:</strong> ${espaco.capacidade} pessoas
           </div>
           <div style="display: flex; gap: 10px; margin-top: 12px;">
            <button class="btn-edit" 
                    style="flex: 1; padding: 6px 0; font-size: 14px; font-weight: 400;" 
                    onclick="SalasModule.openEdit(${espaco.id})">
                Editar
            </button>
            
            <button class="btn-delete" 
                    style="flex: 1; padding: 6px 0; font-size: 14px; font-weight: 400;" 
                    onclick="SalasModule.excluir(${espaco.id})">
                Remover
            </button>
          </div>
       </div>
   `;
        container.appendChild(card);
    });
  }

  async function carregar() {
      try {
          listaSalas = await API.Salas.listar();
          renderizarCards(listaSalas);
      } catch (error) {
          UI.handleApiError(error, 'Erro ao carregar lista de espaços.');
      }
  }

  async function salvar() {
    const saveBtn = document.getElementById('btnSalvarEspaco');
    UI.setButtonLoading(saveBtn, true);

    const payload = {
      nome:       document.getElementById('esp-nome')?.value?.trim(),
      descricao:  document.getElementById('esp-descricao')?.value?.trim(),
      capacidade: Number(document.getElementById('esp-capacidade')?.value),
      cor:         document.getElementById('esp-cor')?.value,
      ativo:       document.getElementById('esp-ativo')?.value === 'Sim',
    };

    if (!payload.nome)       { UI.showToast('Informe o nome do espaço.', 'warning'); UI.setButtonLoading(saveBtn, false); return; }
    if (!payload.capacidade) { UI.showToast('Informe a capacidade.', 'warning'); UI.setButtonLoading(saveBtn, false); return; }

    try {
      if (editingId) {
        await API.Salas.atualizar(editingId, payload);
        UI.showToast('Espaço atualizado com sucesso!', 'success');
      } else {
        await API.Salas.criar(payload);
        UI.showToast('Espaço criado com sucesso!', 'success');
      }
      UI.closeModal('modalEspaco');
      await carregar(); // Recarrega os cards após salvar
    } catch (error) {
      UI.handleApiError(error, 'Erro ao salvar espaço.');
    } finally {
      UI.setButtonLoading(saveBtn, false);
    }
  }

  // Dentro do SalasModule.js
async function excluir(id) {
  // 1. Pedir confirmação ao usuário
  const confirmacao = confirm("Tem certeza que deseja excluir este espaço? Esta ação não pode ser desfeita.");
  
  if (!confirmacao) return;

  try {
      // 2. Chamar a API
      await API.Salas.remover(id);

      // 3. Feedback visual de sucesso
      if (window.UI && UI.showToast) {
          UI.showToast("Espaço removido com sucesso!", "success");
      } else {
          alert("Espaço removido com sucesso!");
      }

      // 4. Recarregar a lista para atualizar a tela
      await carregar(); 

  } catch (error) {
      console.error("Erro ao excluir:", error);
      
      if (window.UI && UI.handleApiError) {
          UI.handleApiError(error, "Não foi possível excluir o espaço.");
      } else {
          alert("Erro ao excluir o espaço. Verifique se existem agendamentos vinculados.");
      }
  }
}

  function init() {
    const btnSalvar = document.getElementById('btnSalvarEspaco');
    if (btnSalvar) btnSalvar.addEventListener('click', salvar);
    carregar(); // Carrega os dados assim que o módulo inicia
  }

  return { init, openNew, openEdit, openDisponibilidade, excluir};

})();
  
  // =============================================
  // Módulo: Bloqueios
  // =============================================
  
  const BloqueiosModule = (() => {

    async function listar() {
      const container = document.getElementById('lista-bloqueios-container');
      
      // Captura os valores dos filtros
      const filtros = {
        salaId: document.getElementById('filtro-espaco-bloqueio').value,
        dataHoraInicio: document.getElementById('filtro-data-inicio').value,
        dataHoraFim: document.getElementById('filtro-data-fim').value
      };
  
      UI.setLoading(container, true, 'Filtrando...');
  
      try {
        // Passa os filtros para a API
        const dados = await API.Bloqueios.listar(filtros);
        
        UI.setLoading(container, false);
        renderizarLista(dados);
      } catch (error) {
        UI.setLoading(container, false);
        UI.handleApiError(error);
      }
    }
  
    function renderizarLista(bloqueios) {
      const container = document.getElementById('lista-bloqueios-container');
      
      if (!bloqueios || bloqueios.length === 0) {
        container.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--color-text-tertiary)">Nenhum horário bloqueado.</div>';
        return;
      }
  
      container.innerHTML = bloqueios.map(b => `
        <div class="block-item">
          <div class="block-info">
            <div class="block-title">${b.motivo}</div>
            <div class="block-sub">
              <strong>${b.nomeSala}</strong> · ${UI.formatDateTime(b.dataHoraInicio)} – ${UI.formatTime(b.dataHoraFim)}
            </div>
          </div>
          <button class="btn btn-danger" style="padding: 5px 12px; font-size: 12px" 
                  onclick="BloqueiosModule.remover(${b.id}, '${b.motivo}')">
            Remover
          </button>
        </div>
      `).join('');
    }
  
    // Função extra para popular o select de filtros
    async function carregarSalasNoFiltroModalo() {
      const selectModal = document.getElementById('bl-espaco');
      const selectFiltro = document.getElementById('filtro-espaco-bloqueio');

      try {
        const salas = await API.Salas.listar();

        // Preenche o select do Modal (Cadastro)
        if (selectModal) {
          selectModal.innerHTML = '<option value="">Selecione...</option>';
          salas.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nome;
            selectModal.appendChild(opt);
          });
        }

        // Preenche o select da Página (Filtro)
        if (selectFiltro) {
          selectFiltro.innerHTML = '<option value="">Todos os espaços</option>';
          salas.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nome;
            selectFiltro.appendChild(opt);
          });
        }
      } catch (e) {
        console.error("Erro ao carregar salas nos selects", e);
        UI.showToast('Erro ao carregar lista de salas', 'danger');
      }
    }
  
  function openNew() {
    const form = document.getElementById('formBloqueio');
    if (form) form.reset();
    
    // Chamando a função que você já definiu abaixo
    carregarSalasNoFiltroModalo(); 
    UI.openModal('modalBloqueio');
  }
  
  async function criar() {
    const saveBtn = document.getElementById('btnCriarBloqueio');
    UI.setButtonLoading(saveBtn, true);

    const payload = {
      salaId:         document.getElementById('bl-espaco').value,
      dataHoraInicio: document.getElementById('bl-inicio').value,
      dataHoraFim:    document.getElementById('bl-fim').value,
      motivo:         document.getElementById('bl-motivo').value.trim(),
    };

    try {
      await API.Bloqueios.criar(payload);
      UI.showToast('Bloqueio registrado!', 'success');
      UI.closeModal('modalBloqueio');
      listar();
    } catch (error) {
      UI.handleApiError(error);
    } finally {
      UI.setButtonLoading(saveBtn, false);
    }
  }
  
    async function remover(id, desc) {
      if (!UI.confirm(`Excluir bloqueio: "${desc}"?`)) return;
      try {
        await API.Bloqueios.remover(id);
        UI.showToast('Bloqueio removido.');
        listar();
      } catch (error) {
        UI.handleApiError(error);
      }
    }
  
    function init() {
      // 1. Listener do Formulário (já configurado)
      const form = document.getElementById('formBloqueio');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          criar();
        });
      }
  
      // 2. Listeners dos Filtros (A MÁGICA AQUI)
      const filtrosIds = ['filtro-espaco-bloqueio', 'filtro-data-inicio', 'filtro-data-fim'];
      filtrosIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('change', () => listar());
        }
      });
  
      // 3. Listener de troca de página (já configurado)
      document.addEventListener('pageChanged', (e) => {
        if (e.detail.pageId === 'bloqueios') {
          listar();
          // Aproveita para carregar as salas no filtro também
          carregarSalasNoFiltroModalo();
        }
      });
    }
  
    return { init, openNew, remover, listar };
  })();
  
  // Expõe para onclick do HTML
  function openNewEspaco()                    { SalasModule.openNew(); }
  function openEditEspaco(id)                 { SalasModule.openEdit(id); }
  function openDisponibilidade(id, nome)      { SalasModule.openDisponibilidade(id, nome); }
  function openNewBloqueio()                  { BloqueiosModule.openNew(); }