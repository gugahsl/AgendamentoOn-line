const DashboardModule = (() => {
    // Seletores dos elementos (baseado na sua imagem do dashboard)
    const selectors = {
        agendamentosHoje: document.getElementById('dash-hoje-total'),
        confirmadosHoje: document.getElementById('dash-hoje-confirmados'),
        totalClientes: document.getElementById('dash-total-clientes'),
        espacosAtivos: document.getElementById('dash-total-salas'),
        tabelaProximos: document.getElementById('tabela-proximos-corpo'),
        containerEspacos: document.getElementById('container-espacos-status')
    };

    async function init() {
        console.log("DashboardModule inicializado");
        await carregarDados();
    }

    async function carregarDados() {
        try {
            // Usando o serviço centralizado do api.js em vez do fetch direto
            const dados = await API.Dashboard.getResumo();
            atualizarUI(dados);
        } catch (error) {
            UI.handleApiError(error, "Erro ao carregar o dashboard");
        }
    }

    function atualizarUI(dados) {
        if (selectors.agendamentosHoje) selectors.agendamentosHoje.textContent = dados.agendamentosHoje;
        if (selectors.confirmadosHoje) selectors.confirmadosHoje.textContent = dados.confirmadosHoje;
        if (selectors.totalClientes) selectors.totalClientes.textContent = dados.totalClientes;
        if (selectors.espacosAtivos) selectors.espacosAtivos.textContent = dados.espacosAtivos;

        const textoEspacos = document.querySelector('#page-dashboard .card:last-child p');
        if (textoEspacos) {
            if (dados.espacosAtivos > 0) {
                textoEspacos.textContent = `${dados.espacosAtivos} espaço(s) disponível(is) para reserva hoje.`;
            } else {
                textoEspacos.textContent = "Nenhum espaço ativo encontrado.";
            }
        }
        
        renderizarListaEspacos(dados.listaEspacos || []);
        renderizarTabela(dados.proximosAgendamentos || []);
    }

    function renderizarListaEspacos(espacos) {
        if (!selectors.containerEspacos) return;

        if (!espacos || espacos.length === 0) {
        selectors.containerEspacos.innerHTML = `
            <div style="text-align: center; color: var(--gray-400); font-size: 13px; padding: 20px;">
                Nenhum espaço cadastrado.
            </div>`;
        return;
    }

    selectors.containerEspacos.innerHTML = espacos.map(espaco => {
        // Debug: Veja no F12 se o status está vindo como "Ativo", "ativo" ou booleano
        console.log(`Sala: ${espaco.nome} | Status vindo do Java: ${espaco.ativo}`);
    
        // Comparação robusta (converte para string e coloca em minúsculo)
        const isAtivo = String(espaco.ativo).toLowerCase() === 'ativo';
        
        const statusClass = isAtivo ? 'status-ativo' : 'status-inativo';
        const statusLabel = isAtivo ? 'Disponível' : 'Manutenção';
    
        return `
            <div class="dashboard-sala-card ${statusClass}">
                <div class="sala-info">
                    <span class="sala-dot"></span>
                    <div class="sala-details">
                        <div class="sala-name">${espaco.nome}</div>
                        <div class="sala-cap">Cap. ${espaco.capacidade} pessoas</div>
                    </div>
                </div>
                <div class="sala-status-label">${statusLabel}</div>
            </div>
        `;
    }).join('');
    }

    function renderizarTabela(agendamentos) {
        if (!selectors.tabelaProximos) return;
    
        if (agendamentos.length === 0) {
            selectors.tabelaProximos.innerHTML = '<tr><td colspan="4" style="text-align:center">Nenhum agendamento para hoje.</td></tr>';
            return;
        }
    
        selectors.tabelaProximos.innerHTML = agendamentos.map(ag => `
            <tr>
                <td style="font-weight: 500">${ag.titulo}</td>
                <td>${ag.cliente}</td>
                <td>${ag.horario}</td> 
                <td>
                    <span class="badge badge-${ag.status.toLowerCase()}">
                        ${ag.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    return { init };
})();