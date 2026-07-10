const API_DASH_SOLICITACOES = "https://backend-service-production-e5a3.up.railway.app/Manutencao/solicitacao/teste";
const API_DASH_USUARIOS = "https://backend-service-production-e5a3.up.railway.app/Manutencao";

const dashboard = {
    totalSolicitacoes: document.getElementById("dashTotalSolicitacoes"),
    abertas: document.getElementById("dashAbertas"),
    andamento: document.getElementById("dashAndamento"),
    concluidas: document.getElementById("dashConcluidas"),
    criticas: document.getElementById("dashCriticas"),
    usuarios: document.getElementById("dashUsuarios"),
    percentual: document.getElementById("dashPercentualConcluido"),
    barraConcluido: document.getElementById("dashBarraConcluido"),
    pendentes: document.getElementById("dashPendentes"),
    canceladas: document.getElementById("dashCanceladas"),
    tecnicos: document.getElementById("dashTecnicos"),
    statusResumo: document.getElementById("dashStatusResumo"),
    prioridadeResumo: document.getElementById("dashPrioridadeResumo"),
    tabelaRecentes: document.getElementById("dashTabelaRecentes"),
    atualizacao: document.getElementById("dashAtualizacao")
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

function escaparHtml(valor) {
    return String(tratar(valor))
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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

function contarPor(lista, campo, valoresEsperados) {
    const resumo = {};
    valoresEsperados.forEach(valor => resumo[valor] = 0);

    lista.forEach(item => {
        const valor = normalizar(item[campo]);
        if (resumo[valor] !== undefined) resumo[valor]++;
    });

    return resumo;
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

function renderizarResumo(solicitacoes, usuarios) {
    const porStatus = contarPor(solicitacoes, "status_solicitacao", ["aberta", "em andamento", "concluida", "cancelada"]);
    const porPrioridade = contarPor(solicitacoes, "prioridade", ["baixa", "media", "alta", "critica"]);
    const total = solicitacoes.length;
    const concluidas = porStatus.concluida || 0;
    const abertas = porStatus.aberta || 0;
    const andamento = porStatus["em andamento"] || 0;
    const canceladas = porStatus.cancelada || 0;
    const pendentes = abertas + andamento;
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    const tecnicos = usuarios.filter(usuario => normalizar(usuario.tipo_usuario) === "manutentor").length;

    dashboard.totalSolicitacoes.innerText = total;
    dashboard.abertas.innerText = abertas;
    dashboard.andamento.innerText = andamento;
    dashboard.concluidas.innerText = concluidas;
    dashboard.criticas.innerText = porPrioridade.critica || 0;
    dashboard.usuarios.innerText = usuarios.length;
    dashboard.percentual.innerText = `${percentual}%`;
    dashboard.barraConcluido.style.width = `${percentual}%`;
    dashboard.pendentes.innerText = pendentes;
    dashboard.canceladas.innerText = canceladas;
    dashboard.tecnicos.innerText = tecnicos;
}

function renderizarGraficos(solicitacoes) {
    const total = solicitacoes.length;
    const porStatus = contarPor(solicitacoes, "status_solicitacao", ["aberta", "em andamento", "concluida", "cancelada"]);
    const porPrioridade = contarPor(solicitacoes, "prioridade", ["baixa", "media", "alta", "critica"]);

    dashboard.statusResumo.innerHTML = [
        criarLinhaBarra("Aberta", porStatus.aberta || 0, total),
        criarLinhaBarra("Em andamento", porStatus["em andamento"] || 0, total),
        criarLinhaBarra("Concluída", porStatus.concluida || 0, total),
        criarLinhaBarra("Cancelada", porStatus.cancelada || 0, total)
    ].join("");

    dashboard.prioridadeResumo.innerHTML = [
        criarLinhaBarra("Baixa", porPrioridade.baixa || 0, total),
        criarLinhaBarra("Média", porPrioridade.media || 0, total),
        criarLinhaBarra("Alta", porPrioridade.alta || 0, total),
        criarLinhaBarra("Crítica", porPrioridade.critica || 0, total)
    ].join("");
}

function renderizarRecentes(solicitacoes) {
    const recentes = [...solicitacoes]
        .sort((a, b) => Number(b.id_solicitacao || 0) - Number(a.id_solicitacao || 0))
        .slice(0, 8);

    if (!recentes.length) {
        dashboard.tabelaRecentes.innerHTML = `<tr><td colspan="6">Nenhuma solicitação encontrada.</td></tr>`;
        return;
    }

    dashboard.tabelaRecentes.innerHTML = recentes.map(item => `
        <tr>
            <td>${escaparHtml(item.id_solicitacao)}</td>
            <td>${escaparHtml(item.nome_solicitante)}</td>
            <td>${escaparHtml(item.tipo_manutencao)}</td>
            <td><span class="badge badge-prioridade ${classePrioridade(item.prioridade)}">${textoPrioridade(item.prioridade)}</span></td>
            <td><span class="badge badge-status ${classeStatus(item.status_solicitacao)}">${textoStatus(item.status_solicitacao)}</span></td>
            <td>${escaparHtml(item.nome_tecnico)}</td>
        </tr>
    `).join("");
}

function carregarDadosUsuario() {
    const tipo = localStorage.getItem("tipo_usuario");
    const nome = localStorage.getItem("nome_usuario");
    const id = localStorage.getItem("id_usuario");
    const rodape = document.getElementById("rodape-usuario");

    if (rodape) {
        rodape.innerHTML = `
            <div class="usuario-box">
                <span><strong>Usuário:</strong> ${escaparHtml(nome || "N/A")}</span>
                <span><strong>Tipo:</strong> ${escaparHtml(tipo || "N/A")}</span>
            </div>
        `;
    }
}

async function carregarDashboard() {
    dashboard.tabelaRecentes.innerHTML = `<tr><td colspan="6">Carregando solicitações...</td></tr>`;
    dashboard.atualizacao.innerText = "Atualizando dados do painel...";

    try {
        const [resSolicitacoes, resUsuarios] = await Promise.all([
            fetch(API_DASH_SOLICITACOES),
            fetch(API_DASH_USUARIOS)
        ]);

        if (!resSolicitacoes.ok) throw new Error("Erro ao buscar solicitações");
        if (!resUsuarios.ok) throw new Error("Erro ao buscar usuários");

        const solicitacoes = await resSolicitacoes.json();
        const usuarios = await resUsuarios.json();

        renderizarResumo(solicitacoes, usuarios);
        renderizarGraficos(solicitacoes);
        renderizarRecentes(solicitacoes);

        dashboard.atualizacao.innerText = `Atualizado em ${new Date().toLocaleString("pt-BR")}`;
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        dashboard.tabelaRecentes.innerHTML = `<tr><td colspan="6">Não foi possível carregar o dashboard. Verifique a conexão com a API.</td></tr>`;
        dashboard.atualizacao.innerText = "Erro ao carregar dados do painel.";
    }
}

document.getElementById("btnAtualizarDashboard").addEventListener("click", carregarDashboard);

carregarDadosUsuario();
carregarDashboard();
