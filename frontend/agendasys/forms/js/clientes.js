/**
 * AgendaSys — Módulo: Clientes
 *
 * Gerencia cadastro, edição e remoção de clientes.
 */

const ClientesModule = (() => {
    let clientesOriginais = []; // Cache para a lista completa
    let editingId = null;
  
    function openNew() {
      editingId = null; 
      const form = document.getElementById('formCliente');
      if (form) {
        form.reset();
      }
      const titulo = document.getElementById('modalClienteTitle');
      if (titulo) {
        titulo.textContent = 'Novo Cliente';
    }
      UI.openModal('modalCliente');
    }
  
    async function openEdit(id) {
      editingId = id;
      try {
        // 1. Busca os dados atualizados do banco
        const cliente = await API.Clientes.buscarPorId(id);

        // 2. Preenche cada campo do formulário pelo ID do input
        // Certifique-se de que o 'id' dos inputs no HTML batem com esses nomes
        document.getElementById('cli-nome').value = cliente.nome;
        document.getElementById('cli-email').value = cliente.email;
        document.getElementById('cli-telefone').value = cliente.telefone;
        document.getElementById('cli-obs').value = cliente.observacoes || '';

        // 3. Muda o título do modal e abre
        document.getElementById('modalClienteTitle').textContent = 'Editar Cliente';
        UI.openModal('modalCliente');

    } catch (error) {
        UI.handleApiError(error, 'Erro ao carregar dados do cliente');
    }
    }
  
    function resetForm() {
      editingId = null;
      const form = document.getElementById('formCliente');
      if (form) form.reset();
    }

    // Dentro do ClientesModule...

  async function listar() {
    const container = document.getElementById('lista-clientes-body');
    if (!container) return;

    // Opcional: mostrar um loading na tabela enquanto busca
    container.innerHTML = '<tr><td colspan="4">Carregando clientes...</td></tr>';

    try {
      clientesOriginais = await API.Clientes.listar(); // Chama o seu api.js
      await atualizarContador();
      
      if (clientesOriginais.length === 0) {
        container.innerHTML = '<tr><td colspan="4">Nenhum cliente cadastrado.</td></tr>';
        return;
      }

      container.innerHTML = ''; // Limpa o loading

      clientesOriginais.forEach(cliente => {
        // Pegar iniciais para o avatar (Ex: João Silva -> JS)
        const iniciais = cliente.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="avatar-circle">${iniciais}</div>
                    <span>${cliente.nome}</span>
                </div>
            </td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone || '—'}</td>
            <td>${UI.truncate(cliente.observacoes, 30)}</td>
            <td>${UI.formatDate(cliente.criadoEm) || '—'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="ClientesModule.openEdit(${cliente.id})">Editar</button>
                <button class="btn btn-delete" onclick="ClientesModule.remover(${cliente.id}, '${cliente.nome}')">Remover</button>
            </td>
        `;
        container.appendChild(tr);
    });
    } catch (error) {
      container.innerHTML = '<tr><td colspan="4">Erro ao carregar clientes.</td></tr>';
      UI.handleApiError(error);
    }
  }

  function filtrar() {
    // 1. Pega o valor da busca
    const buscaInput = document.getElementById('search-cliente');
    if (!buscaInput) return;
    
    const termo = buscaInput.value.trim().toLowerCase();
    
    // 2. Se a busca estiver vazia, renderiza a lista completa
    if (termo === "") {
        renderizarTabela(clientesOriginais);
        atualizarContador();
        return;
    }

    // 3. Filtra a partir dos dados que salvamos no listar()
    const filtrados = clientesOriginais.filter(cliente => {
        const nome = (cliente.nome || "").toLowerCase();
        const email = (cliente.email || "").toLowerCase();
        return nome.includes(termo) || email.includes(termo);
    });

    // 4. Renderiza apenas os encontrados
    renderizarTabela(filtrados);
    
    // 5. Atualiza o contador com o número de filtrados
    const elemento = document.getElementById('contador-clientes');
    if (elemento) {
        elemento.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'encontrado' : 'encontrados'}`;
    }
}

async function atualizarContador() {
  const total = clientesOriginais.length;
  
  const elemento = document.getElementById('contador-clientes');
  if (elemento) {
      elemento.textContent = `${total} ${total === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`;
  }
}
  
    async function salvar() {
      const saveBtn = document.getElementById('btnSalvarCliente');
      UI.setButtonLoading(saveBtn, true);
  
      const payload = {
        nome:        document.getElementById('cli-nome')?.value?.trim(),
        email:       document.getElementById('cli-email')?.value?.trim(),
        telefone:    document.getElementById('cli-telefone')?.value?.trim(),
        observacoes: document.getElementById('cli-obs')?.value?.trim(),
      };
  
      if (!payload.nome)  { UI.showToast('Informe o nome do cliente.', 'warning'); UI.setButtonLoading(saveBtn, false); return; }
      if (!payload.email) { UI.showToast('Informe o e-mail do cliente.', 'warning'); UI.setButtonLoading(saveBtn, false); return; }
  
      try {
        if (editingId) {
          payload.id = editingId;
          await API.Clientes.atualizar(payload);
          UI.showToast('Cliente atualizado com sucesso!', 'success');
        } else {
          await API.Clientes.criar(payload);
          UI.showToast('Cliente cadastrado com sucesso!', 'success');
        }

        resetForm();

        UI.closeModal('modalCliente');
        listar();
      } catch (error) {
        UI.handleApiError(error, 'Erro ao salvar cliente.');
      } finally {
        UI.setButtonLoading(saveBtn, false);
      }
    }
  
    async function remover(id, nome) {
      if (!UI.confirm(`Remover o cliente "${nome}"? Esta ação não pode ser desfeita.`)) return;
      try {
        await API.Clientes.remover(id);
        UI.showToast('Cliente removido.', 'success');
        listar();
      } catch (error) {
        UI.handleApiError(error, 'Erro ao remover cliente.');
      }
    }
  
    // Atualize seu init para carregar a lista assim que começar
  function init() {
    const form = document.getElementById('formCliente');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await salvar();
        listar(); // Recarrega a lista após salvar
      };
    }
    listar(); // Busca os dados do banco ao iniciar o módulo
  }

  function renderizarTabela(clientes) {
    const corpoTabela = document.getElementById('lista-clientes-body');
    if (!corpoTabela) return;

    corpoTabela.innerHTML = '';

    clientes.forEach(cliente => {
        const iniciais = cliente.nome 
            ? cliente.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            : '??';

        const tr = document.createElement('tr');
        // ... dentro do clientes.forEach na função renderizarTabela ...
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="avatar-circle">${iniciais}</div>
                    <span>${cliente.nome}</span>
                </div>
            </td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone || '—'}</td>
            <td>${UI.truncate(cliente.observacoes, 30)}</td>
            <td>${UI.formatDate(cliente.criadoEm) || '—'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="ClientesModule.openEdit(${cliente.id})">Editar</button>
                <button class="btn btn-delete" onclick="ClientesModule.remover(${cliente.id}, '${cliente.nome}')">Remover</button>
            </td>
        `;
// ... resto da função ...
        corpoTabela.appendChild(tr);
    });
}
  
    return { init, openNew, openEdit, remover, listar, atualizarContador, filtrar};
  
  })();

// 1. Registro global para o HTML conseguir enxergar (Caso use onclick direto)
window.ClientesModule = ClientesModule;

// 2. Inicialização automática assim que o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ClientesModule.init());
} else {
  ClientesModule.init();
}