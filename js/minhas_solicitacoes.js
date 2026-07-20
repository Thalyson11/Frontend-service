const content = document.getElementById("content");
let solicitacoesSolicitante = [];
let solicitacoesFiltradas = [];

function normalizarSolicitante(valor) {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function tratarSolicitante(valor) {
    return valor === null || valor === undefined || valor === "" ? "-" : valor;
}

function escapeSolicitante(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function buscar() {
    const idSolicitante = localStorage.getItem("id_usuario");

    if (!idSolicitante) {
        content.className = "";
        content.innerHTML = `<div class="sd-empty-state"><strong>Usuário não logado</strong><span>Faça login novamente para consultar suas solicitações.</span></div>`;
        return;
    }

    content.className = "sd-skeleton-list";
    content.innerHTML = `<div class="sd-skeleton"></div><div class="sd-skeleton"></div><div class="sd-skeleton"></div>`;

    try {
        const url = `https://backend-service-production-ac30.up.railway.app/Manutencao/solicitacao/usuario/${idSolicitante}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Erro na API");

        const data = await res.json();
        solicitacoesSolicitante = Array.isArray(data) ? data : [data];
        aplicarFiltrosSolicitante();

    } catch (err) {
        content.className = "";
        content.innerHTML = `<div class="sd-empty-state"><strong>Não foi possível carregar</strong><span>${escapeSolicitante(err.message)}</span></div>`;
        if (window.SupportDeskUI) SupportDeskUI.toast("Erro ao carregar suas solicitações.", "erro");
    }
}

function aplicarFiltrosSolicitante() {
    const busca = normalizarSolicitante(document.getElementById("buscarSolicitacao")?.value);
    const status = normalizarSolicitante(document.getElementById("filtroStatusSolicitante")?.value);
    const prioridade = normalizarSolicitante(document.getElementById("filtroPrioridadeSolicitante")?.value);

    solicitacoesFiltradas = solicitacoesSolicitante.filter((item) => {
        const texto = normalizarSolicitante([
            item.id_solicitacao,
            item.nome_solicitante,
            item.tipo_manutencao,
            item.descricao,
            item.prioridade,
            item.status_solicitacao,
            item.nome_tecnico,
            item.data_abertura,
            item.solucao,
            item.data_conclusao
        ].join(" "));

        const bateBusca = !busca || texto.includes(busca);
        const bateStatus = !status || normalizarSolicitante(item.status_solicitacao) === status;
        const batePrioridade = !prioridade || normalizarSolicitante(item.prioridade) === prioridade;

        return bateBusca && bateStatus && batePrioridade;
    });

    renderizarSolicitacoes(solicitacoesFiltradas);
}

function renderizarSolicitacoes(lista) {
    const contador = document.getElementById("contadorSolicitante");
    if (contador) {
        contador.innerText = `${lista.length} de ${solicitacoesSolicitante.length} solicitaç${lista.length === 1 ? "ão" : "ões"}`;
    }

    if (!solicitacoesSolicitante.length) {
        content.className = "";
        content.innerHTML = `
            <div class="sd-empty-state">
                <strong>Nenhuma solicitação encontrada</strong>
                <span>Clique em “Nova Solicitação” para registrar o primeiro chamado.</span>
            </div>`;
        return;
    }

    if (!lista.length) {
        content.className = "";
        content.innerHTML = `
            <div class="sd-empty-state">
                <strong>Nenhum resultado para os filtros</strong>
                <span>Limpe os filtros ou tente outros termos de pesquisa.</span>
            </div>`;
        return;
    }

    content.className = "grid";
    content.innerHTML = lista.map(item => `
        <div class="card" data-solicitacao-id="${escapeSolicitante(item.id_solicitacao ?? "")}">
            <div class="title">
                Solicitação #${escapeSolicitante(tratarSolicitante(item.id_solicitacao))}
                <button type="button" class="sd-copy-button" onclick="copiarSolicitacao('${escapeSolicitante(item.id_solicitacao ?? "")}')" title="Copiar ID">⧉</button>
            </div>

            <div class="row">
                <span>Solicitante</span>
                <span class="value">${escapeSolicitante(tratarSolicitante(item.nome_solicitante))}</span>
            </div>

            <div class="row">
                <span>Tipo Manutenção</span>
                <span class="value">${escapeSolicitante(tratarSolicitante(item.tipo_manutencao))}</span>
            </div>

            <div class="row">
                <span>Descrição</span>
                <span class="value">${escapeSolicitante(tratarSolicitante(item.descricao))}</span>
            </div>

            <div class="row">
                <span>Prioridade</span>
                <span class="value"><span class="badge ${getPriorityClass(item.prioridade)}">${escapeSolicitante(tratarSolicitante(item.prioridade))}</span></span>
            </div>

            <div class="row">
                <span>Status</span>
                <span class="value"><span class="badge ${getStatusClass(item.status_solicitacao)}">${escapeSolicitante(tratarSolicitante(item.status_solicitacao))}</span></span>
            </div>

            <div class="row">
                <span>Técnico</span>
                <span class="value">${escapeSolicitante(tratarSolicitante(item.nome_tecnico))}</span>
            </div>

            <div class="row">
                <span>Data Abertura</span>
                <span class="value">${escapeSolicitante(tratarSolicitante(item.data_abertura))}</span>
            </div>

            <details class="detalhes-solicitacao">
                <summary>Visualizar detalhes</summary>
                <div class="row">
                    <span>Solução</span>
                    <span class="value">${escapeSolicitante(tratarSolicitante(item.solucao))}</span>
                </div>
                <div class="row">
                    <span>Data Solução</span>
                    <span class="value">${escapeSolicitante(tratarSolicitante(item.data_conclusao))}</span>
                </div>
            </details>
        </div>
    `).join("");

    if (window.SupportDeskUI) SupportDeskUI.decorateBadges(content);
}

function carregarStats(lista) {
    const total = document.getElementById("totalSolicitacoes");
    const andamento = document.getElementById("totalAndamento");
    const concluidas = document.getElementById("totalConcluidas");
    const alta = document.getElementById("totalAlta");

    if (!total || !andamento || !concluidas || !alta) return;

    const stats = lista.reduce((acc, item) => {
        acc.total++;
        const status = normalizarSolicitante(item.status_solicitacao);
        const prioridade = normalizarSolicitante(item.prioridade);
        if (status === "em andamento") acc.andamento++;
        if (status === "concluida") acc.concluidas++;
        if (prioridade === "alta") acc.alta++;
        return acc;
    }, { total: 0, andamento: 0, concluidas: 0, alta: 0 });

    total.innerText = stats.total;
    andamento.innerText = stats.andamento;
    concluidas.innerText = stats.concluidas;
    alta.innerText = stats.alta;
}

function getPriorityClass(p) {
    if (!p) return "priority-baixa baixa";
    p = p.toLowerCase();

    if (p.includes("critica") || p.includes("crítica")) return "priority-critica critica";
    if (p.includes("alta")) return "priority-alta alta";
    if (p.includes("media") || p.includes("média")) return "priority-media media";
    return "priority-baixa baixa";
}
function getStatusClass(status) {
    if (!status) return "";

    switch (status.toLowerCase()) {
        case "aberta":
            return "status-aberta aberta";
        case "em andamento":
            return "status-andamento em-andamento";
        case "concluida":
        case "concluída":
            return "status-concluida concluida";
        case "cancelada":
            return "status-cancelada cancelada";
        default:
            return "";
    }
}

function copiarSolicitacao(id) {
    if (window.SupportDeskUI) {
        SupportDeskUI.copyText(id, "ID da solicitação");
        return;
    }
    navigator.clipboard?.writeText(String(id || ""));
}

function atualizarChipsSolicitante(selectId) {
    const select = document.getElementById(selectId);
    const grupo = document.querySelector(`[data-filter-group="${selectId}"]`);
    if (!select || !grupo) return;

    grupo.querySelectorAll(".filter-chip").forEach((botao) => {
        botao.classList.toggle("active", botao.dataset.filterValue === select.value);
    });
}

function limparFiltrosSolicitante() {
    const busca = document.getElementById("buscarSolicitacao");
    const status = document.getElementById("filtroStatusSolicitante");
    const prioridade = document.getElementById("filtroPrioridadeSolicitante");
    if (busca) busca.value = "";
    if (status) status.value = "";
    if (prioridade) prioridade.value = "";
    atualizarChipsSolicitante("filtroStatusSolicitante");
    atualizarChipsSolicitante("filtroPrioridadeSolicitante");
    aplicarFiltrosSolicitante();
}

function exportarSolicitacoesCsv() {
    if (!solicitacoesFiltradas.length) {
        if (window.SupportDeskUI) SupportDeskUI.toast("Não há solicitações para exportar.", "aviso");
        else alert("Não há solicitações para exportar.");
        return;
    }

    const cabecalho = ["ID", "Solicitante", "Tipo", "Descrição", "Prioridade", "Status", "Técnico", "Data Abertura", "Solução", "Data Solução"];
    const linhas = solicitacoesFiltradas.map(item => [
        tratarSolicitante(item.id_solicitacao),
        tratarSolicitante(item.nome_solicitante),
        tratarSolicitante(item.tipo_manutencao),
        tratarSolicitante(item.descricao),
        tratarSolicitante(item.prioridade),
        tratarSolicitante(item.status_solicitacao),
        tratarSolicitante(item.nome_tecnico),
        tratarSolicitante(item.data_abertura),
        tratarSolicitante(item.solucao),
        tratarSolicitante(item.data_conclusao)
    ]);

    const csv = [cabecalho, ...linhas]
        .map(linha => linha.map(valor => `"${String(valor).replaceAll('"', '""')}"`).join(";"))
        .join("\n");

    const arquivo = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "minhas-solicitacoes.csv";
    link.click();
    URL.revokeObjectURL(url);

    if (window.SupportDeskUI) SupportDeskUI.toast("Arquivo CSV gerado com sucesso.", "sucesso");
}

function carregarDadosUsuario() {
  const tipo = localStorage.getItem("tipo_usuario");
  const nome = localStorage.getItem("nome_usuario");

  const rodape = document.getElementById("rodape-usuario");

  if (rodape) {
      rodape.innerHTML = `
          <div class="usuario-box">
              <span><strong>Usuário:</strong> ${nome || "N/A"}</span>
              <span><strong>Tipo:</strong> ${tipo || "N/A"}</span>
          </div>
      `;
  }
  
  buscar();
}
window.onload = carregarDadosUsuario;

document.getElementById("buscarSolicitacao")?.addEventListener("input", aplicarFiltrosSolicitante);
document.getElementById("filtroStatusSolicitante")?.addEventListener("change", aplicarFiltrosSolicitante);
document.getElementById("filtroPrioridadeSolicitante")?.addEventListener("change", aplicarFiltrosSolicitante);
document.getElementById("btnLimparFiltrosSolicitante")?.addEventListener("click", limparFiltrosSolicitante);
document.getElementById("btnExportarSolicitante")?.addEventListener("click", exportarSolicitacoesCsv);
document.getElementById("btnImprimirSolicitante")?.addEventListener("click", () => window.print());

const API_URL = "https://backend-service-production-ac30.up.railway.app/Manutencao/solicitacao/teste";

// ABRIR MODAL
function abrirModalAdicionar() {
    const modal = document.getElementById("modalAdicionar");
    if (!modal) return;
    modal.style.display = "flex";
    modal.scrollTop = 0;
    document.body.classList.add("sd-modal-open");
}

// FECHAR MODAL
function fecharModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = "none";
    document.body.classList.remove("sd-modal-open");
}

// ADICIONAR SOLICITAÇÃO
    async function adicionarsolicitacoes() {
        const id_solicitante = document.getElementById("solicitanteAdd").value;
        const tipo_manutencao = document.getElementById("tipoAdd").value;
        const descricao = document.getElementById("descricaoAdd").value;
        const prioridade= document.getElementById("prioridadeAdd").value;
        const status_solicitacao= document.getElementById("statusAdd").value;
        const id_tecnico = null;    
        console.log(
            id_solicitante,
            tipo_manutencao,
            descricao,
            prioridade,
            status_solicitacao
          );
    
    
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_solicitante, tipo_manutencao, descricao, prioridade, status_solicitacao,id_tecnico, data_abertura: new Date().toISOString().split('T')[0] })
        });
            console.log(id_solicitante, tipo_manutencao, descricao, prioridade, status_solicitacao);
        fecharModal("modalAdicionar");
        alert("Adicionado com sucesso");
        buscar();

    }
    
    async function carregarSolicitantes(tipo, selectId) {
        try {
          const response = await fetch(`https://backend-service-production-ac30.up.railway.app/Manutencao/${tipo}`);
          const dados = await response.json();
      
          const select = document.getElementById(selectId);
      
          select.innerHTML = `<option value="">Selecione</option>`;
      
          dados.forEach(u => {
            select.innerHTML += `
              <option value="${u.id_usuario}">
                ${u.nome}
              </option>
            `;
          });
      
        } catch (error) {
          console.error("Erro ao carregar solicitantes:", error);
        }
      }

      function validarFormulario() {

        const form = document.getElementById("formSolicitacao");
      
        if (form.reportValidity()) {
          adicionarsolicitacoes(),
          editarsolicitacoes();
        }
      
      }
function editarsolicitacoes() {
    return null;
}


document.querySelectorAll(".filter-chip-group").forEach((grupo) => {
    const selectId = grupo.dataset.filterGroup;
    const select = document.getElementById(selectId);

    grupo.querySelectorAll(".filter-chip").forEach((botao) => {
        botao.addEventListener("click", () => {
            if (!select) return;
            select.value = botao.dataset.filterValue || "";
            atualizarChipsSolicitante(selectId);
            aplicarFiltrosSolicitante();
        });
    });

    atualizarChipsSolicitante(selectId);
});
