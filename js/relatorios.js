const tipoRelatorioAdministrativo = String(localStorage.getItem("tipo_usuario") || "").toLowerCase();
if (tipoRelatorioAdministrativo === "manutentor") {
    window.location.replace("RelatorioTecnico.html");
    throw new Error("Relatório administrativo restrito ao gestor.");
}
if (tipoRelatorioAdministrativo === "solicitante") {
    window.location.replace("RelatorioSolicitante.html");
    throw new Error("Relatório administrativo restrito ao gestor.");
}

const API_SOLICITACOES = "https://backend-service-production-ac30.up.railway.app/Manutencao/solicitacao/teste";
const API_USUARIOS = "https://backend-service-production-ac30.up.railway.app/Manutencao";

let solicitacoesRelatorio = [];
let usuariosRelatorio = [];
let dadosFiltrados = [];
const FILTROS_FAVORITOS_KEY = "supportdesk_relatorios_filtros_favoritos";

const elementos = {
    totalSolicitacoes: document.getElementById("totalSolicitacoes"),
    totalAbertas: document.getElementById("totalAbertas"),
    totalAndamento: document.getElementById("totalAndamento"),
    totalConcluidas: document.getElementById("totalConcluidas"),
    totalCanceladas: document.getElementById("totalCanceladas"),
    totalUsuarios: document.getElementById("totalUsuarios"),
    tabela: document.getElementById("tabelaRelatorio"),
    prioridadeResumo: document.getElementById("prioridadeResumo"),
    statusResumo: document.getElementById("statusResumo"),
    totalFiltrado: document.getElementById("totalFiltrado"),
    busca: document.getElementById("buscaRelatorio"),
    status: document.getElementById("filtroStatus"),
    prioridade: document.getElementById("filtroPrioridade")
};

function normalizar(valor) {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function tratar(valor) {
    return valor === null || valor === undefined || valor === "" ? "------" : valor;
}

function textoStatus(status) {
    const valor = normalizar(status);
    if (valor === "aberta") return "Aberta";
    if (valor === "em andamento") return "Em andamento";
    if (valor === "concluida") return "Concluída";
    if (valor === "cancelada") return "Cancelada";
    return tratar(status);
}

function textoPrioridade(prioridade) {
    const valor = normalizar(prioridade);
    if (valor === "baixa") return "Baixa";
    if (valor === "media") return "Média";
    if (valor === "alta") return "Alta";
    if (valor === "critica") return "Crítica";
    return tratar(prioridade);
}

function classeStatus(status) {
    const valor = normalizar(status);
    if (valor === "aberta") return "aberta";
    if (valor === "em andamento") return "em-andamento";
    if (valor === "concluida") return "concluida";
    if (valor === "cancelada") return "cancelada";
    return "neutro";
}

function classePrioridade(prioridade) {
    const valor = normalizar(prioridade);
    if (["baixa", "media", "alta", "critica"].includes(valor)) return valor;
    return "baixa";
}

async function carregarRelatorio() {
    elementos.tabela.innerHTML = `<tr><td colspan="7">Carregando relatório...</td></tr>`;

    try {
        const [resSolicitacoes, resUsuarios] = await Promise.all([
            fetch(API_SOLICITACOES),
            fetch(API_USUARIOS)
        ]);

        if (!resSolicitacoes.ok) throw new Error("Erro ao buscar solicitações");
        if (!resUsuarios.ok) throw new Error("Erro ao buscar usuários");

        solicitacoesRelatorio = await resSolicitacoes.json();
        usuariosRelatorio = await resUsuarios.json();

        aplicarFiltros();
    } catch (error) {
        console.error("Erro ao carregar relatório:", error);
        elementos.tabela.innerHTML = `
            <tr>
                <td colspan="7">Não foi possível carregar o relatório. Verifique a conexão com a API.</td>
            </tr>
        `;
    }
}

function aplicarFiltros() {
    const busca = normalizar(elementos.busca.value);
    const filtroStatus = normalizar(elementos.status.value);
    const filtroPrioridade = normalizar(elementos.prioridade.value);

    dadosFiltrados = solicitacoesRelatorio.filter(item => {
        const status = normalizar(item.status_solicitacao);
        const prioridade = normalizar(item.prioridade);
        const texto = normalizar([
            item.id_solicitacao,
            item.nome_solicitante,
            item.nome_tecnico,
            item.tipo_manutencao,
            item.descricao,
            item.prioridade,
            item.status_solicitacao
        ].join(" "));

        const bateStatus = !filtroStatus || status === filtroStatus;
        const batePrioridade = !filtroPrioridade || prioridade === filtroPrioridade;
        const bateBusca = !busca || texto.includes(busca);

        return bateStatus && batePrioridade && bateBusca;
    });

    renderizarResumo(solicitacoesRelatorio);
    renderizarGraficos(dadosFiltrados);
    renderizarTabela(dadosFiltrados);
}

function contarPor(lista, campo, valoresEsperados) {
    const resumo = {};
    valoresEsperados.forEach(valor => resumo[valor] = 0);

    lista.forEach(item => {
        const valor = normalizar(item[campo]);
        if (resumo[valor] !== undefined) resumo[valor]++;
    });

    return resumo;
}

function renderizarResumo(lista) {
    const porStatus = contarPor(lista, "status_solicitacao", ["aberta", "em andamento", "concluida", "cancelada"]);

    elementos.totalSolicitacoes.innerText = lista.length;
    elementos.totalAbertas.innerText = porStatus["aberta"] || 0;
    elementos.totalAndamento.innerText = porStatus["em andamento"] || 0;
    elementos.totalConcluidas.innerText = porStatus["concluida"] || 0;
    elementos.totalCanceladas.innerText = porStatus["cancelada"] || 0;
    elementos.totalUsuarios.innerText = usuariosRelatorio.length || 0;
}

function criarLinhaBarra(label, quantidade, total) {
    const largura = total > 0 ? Math.round((quantidade / total) * 100) : 0;

    return `
        <div class="bar-row">
            <span>${label}</span>
            <div class="bar-track">
                <div class="bar-fill" style="width:${largura}%"></div>
            </div>
            <strong>${quantidade}</strong>
        </div>
    `;
}

function renderizarGraficos(lista) {
    const total = lista.length;
    const porPrioridade = contarPor(lista, "prioridade", ["baixa", "media", "alta", "critica"]);
    const porStatus = contarPor(lista, "status_solicitacao", ["aberta", "em andamento", "concluida", "cancelada"]);

    elementos.prioridadeResumo.innerHTML = [
        criarLinhaBarra("Baixa", porPrioridade.baixa || 0, total),
        criarLinhaBarra("Média", porPrioridade.media || 0, total),
        criarLinhaBarra("Alta", porPrioridade.alta || 0, total),
        criarLinhaBarra("Crítica", porPrioridade.critica || 0, total)
    ].join("");

    elementos.statusResumo.innerHTML = [
        criarLinhaBarra("Aberta", porStatus.aberta || 0, total),
        criarLinhaBarra("Em andamento", porStatus["em andamento"] || 0, total),
        criarLinhaBarra("Concluída", porStatus.concluida || 0, total),
        criarLinhaBarra("Cancelada", porStatus.cancelada || 0, total)
    ].join("");
}

function renderizarTabela(lista) {
    elementos.totalFiltrado.innerText = `${lista.length} registro${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;

    if (!lista.length) {
        elementos.tabela.innerHTML = `<tr><td colspan="7">Nenhum registro encontrado para os filtros selecionados.</td></tr>`;
        return;
    }

    elementos.tabela.innerHTML = lista.map(item => `
        <tr>
            <td>${tratar(item.id_solicitacao)}</td>
            <td>${tratar(item.nome_solicitante)}</td>
            <td>${tratar(item.tipo_manutencao)}</td>
            <td><span class="badge badge-prioridade ${classePrioridade(item.prioridade)}">${textoPrioridade(item.prioridade)}</span></td>
            <td><span class="badge badge-status ${classeStatus(item.status_solicitacao)}">${textoStatus(item.status_solicitacao)}</span></td>
            <td>${tratar(item.nome_tecnico)}</td>
            <td>${tratar(item.data_conclusao)}</td>
        </tr>
    `).join("");
}

function exportarCsv() {
    if (!dadosFiltrados.length) {
        alert("Não há dados para exportar.");
        return;
    }

    const cabecalho = ["ID", "Solicitante", "Tipo", "Prioridade", "Status", "Técnico", "Conclusão"];
    const linhas = dadosFiltrados.map(item => [
        tratar(item.id_solicitacao),
        tratar(item.nome_solicitante),
        tratar(item.tipo_manutencao),
        textoPrioridade(item.prioridade),
        textoStatus(item.status_solicitacao),
        tratar(item.nome_tecnico),
        tratar(item.data_conclusao)
    ]);

    const csv = [cabecalho, ...linhas]
        .map(linha => linha.map(valor => `"${String(valor).replaceAll('"', '""')}"`).join(";"))
        .join("\n");

    const arquivo = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-solicitacoes.csv";
    link.click();
    URL.revokeObjectURL(url);
}

function limparFiltros() {
    elementos.busca.value = "";
    elementos.status.value = "";
    elementos.prioridade.value = "";
    aplicarFiltros();
}

function obterFiltrosFavoritos() {
    try {
        return JSON.parse(localStorage.getItem(FILTROS_FAVORITOS_KEY) || "[]");
    } catch (error) {
        return [];
    }
}

function salvarFiltrosFavoritos(lista) {
    localStorage.setItem(FILTROS_FAVORITOS_KEY, JSON.stringify(lista.slice(0, 8)));
}

function renderizarFiltrosFavoritos() {
    if (!elementos.favoritos) return;

    const favoritos = obterFiltrosFavoritos();
    elementos.favoritos.innerHTML = '<option value="">Filtros favoritos</option>' + favoritos.map((filtro, index) => {
        const label = [
            filtro.busca ? `Busca: ${filtro.busca}` : null,
            filtro.status ? `Status: ${filtro.status}` : null,
            filtro.prioridade ? `Prioridade: ${filtro.prioridade}` : null
        ].filter(Boolean).join(" • ") || "Sem filtros";

        return `<option value="${index}">${label}</option>`;
    }).join("");
}

function favoritarFiltrosAtuais() {
    const filtro = {
        busca: elementos.busca.value.trim(),
        status: elementos.status.value,
        prioridade: elementos.prioridade.value
    };

    if (!filtro.busca && !filtro.status && !filtro.prioridade) {
        if (window.SupportDeskUI) SupportDeskUI.toast("Escolha pelo menos um filtro antes de favoritar.", "aviso");
        else alert("Escolha pelo menos um filtro antes de favoritar.");
        return;
    }

    const favoritos = obterFiltrosFavoritos();
    const iguais = JSON.stringify(filtro);
    const novaLista = [filtro, ...favoritos.filter(item => JSON.stringify(item) !== iguais)];
    salvarFiltrosFavoritos(novaLista);
    renderizarFiltrosFavoritos();

    if (window.SupportDeskUI) SupportDeskUI.toast("Filtro salvo como favorito.", "sucesso");
}

function aplicarFiltroFavorito() {
    if (!elementos.favoritos || elementos.favoritos.value === "") return;

    const favoritos = obterFiltrosFavoritos();
    const filtro = favoritos[Number(elementos.favoritos.value)];
    if (!filtro) return;

    elementos.busca.value = filtro.busca || "";
    elementos.status.value = filtro.status || "";
    elementos.prioridade.value = filtro.prioridade || "";
    aplicarFiltros();
}

function carregarDadosUsuario() {
    const tipo = localStorage.getItem("tipo_usuario");
    const nome = localStorage.getItem("nome_usuario");
    const id = localStorage.getItem("id_usuario");
    const rodape = document.getElementById("rodape-usuario");

    if (rodape) {
        rodape.innerHTML = `
            <div class="usuario-box">
                <span><strong>Usuário:</strong> ${nome || "N/A"}</span>
                <span><strong>Tipo:</strong> ${tipo || "N/A"}</span>
              </div>
        `;
    }
}

document.getElementById("btnAtualizar").addEventListener("click", carregarRelatorio);
document.getElementById("btnExportar").addEventListener("click", exportarCsv);
document.getElementById("btnImprimir").addEventListener("click", () => window.print());
document.getElementById("btnLimparFiltros").addEventListener("click", limparFiltros);
elementos.favoritar?.addEventListener("click", favoritarFiltrosAtuais);
elementos.favoritos?.addEventListener("change", aplicarFiltroFavorito);
elementos.busca.addEventListener("input", aplicarFiltros);
elementos.status.addEventListener("change", aplicarFiltros);
elementos.prioridade.addEventListener("change", aplicarFiltros);

renderizarFiltrosFavoritos();
carregarDadosUsuario();
carregarRelatorio();
