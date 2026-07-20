(function () {
    const perfil = document.body.dataset.relatorioPerfil;
    const idUsuario = localStorage.getItem("id_usuario");
    const nomeUsuario = localStorage.getItem("nome_usuario") || "N/A";
    const tipoUsuario = localStorage.getItem("tipo_usuario") || "N/A";
    const API_BASE = "https://backend-service-production-ac30.up.railway.app/Manutencao/solicitacao";

    let dadosRelatorio = [];
    let dadosFiltrados = [];

    const elementos = {
        total: document.getElementById("perfilTotal"),
        abertas: document.getElementById("perfilAbertas"),
        andamento: document.getElementById("perfilAndamento"),
        concluidas: document.getElementById("perfilConcluidas"),
        canceladas: document.getElementById("perfilCanceladas"),
        tempoMedio: document.getElementById("perfilTempoMedio"),
        prioridadeResumo: document.getElementById("perfilPrioridadeResumo"),
        statusResumo: document.getElementById("perfilStatusResumo"),
        evolucaoResumo: document.getElementById("perfilEvolucaoResumo"),
        tabela: document.getElementById("perfilTabela"),
        totalFiltrado: document.getElementById("perfilTotalFiltrado"),
        busca: document.getElementById("perfilBusca"),
        status: document.getElementById("perfilFiltroStatus"),
        prioridade: document.getElementById("perfilFiltroPrioridade")
    };

    function normalizar(valor) {
        return String(valor || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function escapeHtml(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function tratar(valor) {
        return valor === null || valor === undefined || valor === "" ? "-" : valor;
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
        if (valor === "aberta") return "aberta status-aberta";
        if (valor === "em andamento") return "em-andamento status-andamento";
        if (valor === "concluida") return "concluida status-concluida";
        if (valor === "cancelada") return "cancelada status-cancelada";
        return "neutro";
    }

    function classePrioridade(prioridade) {
        const valor = normalizar(prioridade);
        if (valor === "baixa") return "baixa priority-baixa";
        if (valor === "media") return "media priority-media";
        if (valor === "alta") return "alta priority-alta";
        if (valor === "critica") return "critica priority-critica";
        return "baixa priority-baixa";
    }

    function endpointPerfil() {
        if (perfil === "tecnico") return `${API_BASE}/tecnico/${idUsuario}`;
        return `${API_BASE}/usuario/${idUsuario}`;
    }

    function contarPor(lista, campo, valores) {
        const resumo = {};
        valores.forEach((valor) => resumo[valor] = 0);
        lista.forEach((item) => {
            const valor = normalizar(item[campo]);
            if (resumo[valor] !== undefined) resumo[valor]++;
        });
        return resumo;
    }

    function parseData(valor) {
        if (!valor) return null;
        const texto = String(valor).trim();
        const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (br) {
            const dataBr = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
            return Number.isNaN(dataBr.getTime()) ? null : dataBr;
        }
        const data = new Date(texto);
        return Number.isNaN(data.getTime()) ? null : data;
    }

    function calcularTempoMedio(lista) {
        const duracoes = lista
            .map((item) => {
                const abertura = parseData(item.data_abertura);
                const conclusao = parseData(item.data_conclusao);
                if (!abertura || !conclusao) return null;
                const dias = Math.max(0, Math.round((conclusao - abertura) / 86400000));
                return dias;
            })
            .filter((dias) => dias !== null);

        if (!duracoes.length) return "-";
        const media = duracoes.reduce((acc, dias) => acc + dias, 0) / duracoes.length;
        return `${media.toFixed(media >= 10 ? 0 : 1).replace(".", ",")} dia${media === 1 ? "" : "s"}`;
    }

    function chaveMes(item) {
        const data = parseData(item.data_abertura) || parseData(item.data_conclusao);
        if (!data) return "Sem data";
        return `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
    }

    function criarLinhaBarra(label, quantidade, total) {
        const largura = total > 0 ? Math.round((quantidade / total) * 100) : 0;
        return `
            <div class="bar-row">
                <span>${escapeHtml(label)}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${largura}%"></div></div>
                <strong>${quantidade}</strong>
            </div>
        `;
    }

    function renderizarResumo(listaBase, listaFiltrada) {
        const porStatus = contarPor(listaBase, "status_solicitacao", ["aberta", "em andamento", "concluida", "cancelada"]);

        elementos.total.innerText = listaBase.length;
        elementos.abertas.innerText = porStatus.aberta || 0;
        elementos.andamento.innerText = porStatus["em andamento"] || 0;
        elementos.concluidas.innerText = porStatus.concluida || 0;
        elementos.canceladas.innerText = porStatus.cancelada || 0;
        elementos.tempoMedio.innerText = calcularTempoMedio(listaBase);

        const total = listaFiltrada.length;
        const porPrioridade = contarPor(listaFiltrada, "prioridade", ["baixa", "media", "alta", "critica"]);
        const porStatusFiltrado = contarPor(listaFiltrada, "status_solicitacao", ["aberta", "em andamento", "concluida", "cancelada"]);
        const porMes = listaFiltrada.reduce((acc, item) => {
            const mes = chaveMes(item);
            acc[mes] = (acc[mes] || 0) + 1;
            return acc;
        }, {});
        const meses = Object.keys(porMes).sort((a, b) => {
            if (a === "Sem data") return 1;
            if (b === "Sem data") return -1;
            const [ma, aa] = a.split("/").map(Number);
            const [mb, ab] = b.split("/").map(Number);
            return aa === ab ? ma - mb : aa - ab;
        }).slice(-8);

        elementos.prioridadeResumo.innerHTML = [
            criarLinhaBarra("Baixa", porPrioridade.baixa || 0, total),
            criarLinhaBarra("Média", porPrioridade.media || 0, total),
            criarLinhaBarra("Alta", porPrioridade.alta || 0, total),
            criarLinhaBarra("Crítica", porPrioridade.critica || 0, total)
        ].join("");

        elementos.statusResumo.innerHTML = [
            criarLinhaBarra("Aberta", porStatusFiltrado.aberta || 0, total),
            criarLinhaBarra("Em andamento", porStatusFiltrado["em andamento"] || 0, total),
            criarLinhaBarra("Concluída", porStatusFiltrado.concluida || 0, total),
            criarLinhaBarra("Cancelada", porStatusFiltrado.cancelada || 0, total)
        ].join("");

        elementos.evolucaoResumo.innerHTML = meses.length
            ? meses.map((mes) => criarLinhaBarra(mes, porMes[mes], Math.max(...Object.values(porMes)))).join("")
            : `<div class="sd-empty-state compact"><strong>Sem evolução mensal</strong><span>Não há datas suficientes para montar a evolução.</span></div>`;
    }

    function aplicarFiltros() {
        const busca = normalizar(elementos.busca.value);
        const status = normalizar(elementos.status.value);
        const prioridade = normalizar(elementos.prioridade.value);

        dadosFiltrados = dadosRelatorio.filter((item) => {
            const texto = normalizar([
                item.id_solicitacao,
                item.nome_solicitante,
                item.nome_tecnico,
                item.tipo_manutencao,
                item.descricao,
                item.prioridade,
                item.status_solicitacao,
                item.data_abertura,
                item.data_conclusao
            ].join(" "));

            return (!busca || texto.includes(busca))
                && (!status || normalizar(item.status_solicitacao) === status)
                && (!prioridade || normalizar(item.prioridade) === prioridade);
        });

        renderizarResumo(dadosRelatorio, dadosFiltrados);
        renderizarTabela(dadosFiltrados);
    }

    function renderizarTabela(lista) {
        elementos.totalFiltrado.innerText = `${lista.length} registro${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;

        if (!lista.length) {
            elementos.tabela.innerHTML = `<tr><td colspan="8">Nenhum registro encontrado para os filtros selecionados.</td></tr>`;
            return;
        }

        elementos.tabela.innerHTML = lista.map((item) => {
            if (perfil === "tecnico") {
                return `
                    <tr>
                        <td>${escapeHtml(tratar(item.id_solicitacao))}</td>
                        <td>${escapeHtml(tratar(item.nome_solicitante))}</td>
                        <td>${escapeHtml(tratar(item.tipo_manutencao))}</td>
                        <td class="report-description-cell" title="${escapeHtml(tratar(item.descricao))}">${escapeHtml(tratar(item.descricao))}</td>
                        <td><span class="badge badge-prioridade ${classePrioridade(item.prioridade)}">${escapeHtml(textoPrioridade(item.prioridade))}</span></td>
                        <td><span class="badge badge-status ${classeStatus(item.status_solicitacao)}">${escapeHtml(textoStatus(item.status_solicitacao))}</span></td>
                        <td>${escapeHtml(tratar(item.data_abertura))}</td>
                        <td>${escapeHtml(tratar(item.data_conclusao))}</td>
                    </tr>
                `;
            }

            return `
                <tr>
                    <td>${escapeHtml(tratar(item.id_solicitacao))}</td>
                    <td>${escapeHtml(tratar(item.tipo_manutencao))}</td>
                    <td class="report-description-cell" title="${escapeHtml(tratar(item.descricao))}">${escapeHtml(tratar(item.descricao))}</td>
                    <td><span class="badge badge-prioridade ${classePrioridade(item.prioridade)}">${escapeHtml(textoPrioridade(item.prioridade))}</span></td>
                    <td><span class="badge badge-status ${classeStatus(item.status_solicitacao)}">${escapeHtml(textoStatus(item.status_solicitacao))}</span></td>
                    <td>${escapeHtml(tratar(item.nome_tecnico))}</td>
                    <td>${escapeHtml(tratar(item.data_abertura))}</td>
                    <td>${escapeHtml(tratar(item.data_conclusao))}</td>
                </tr>
            `;
        }).join("");

        if (window.SupportDeskUI) SupportDeskUI.decorateBadges(document);
    }

    async function carregarRelatorioPerfil() {
        if (!idUsuario) {
            elementos.tabela.innerHTML = `<tr><td colspan="8">Usuário não logado.</td></tr>`;
            return;
        }

        elementos.tabela.innerHTML = `<tr><td colspan="8">Carregando relatório...</td></tr>`;

        try {
            const res = await fetch(endpointPerfil());
            if (!res.ok) throw new Error("Erro ao buscar dados do relatório");

            const data = await res.json();
            dadosRelatorio = Array.isArray(data) ? data : [data];
            aplicarFiltros();
        } catch (error) {
            console.error(error);
            elementos.tabela.innerHTML = `<tr><td colspan="8">Não foi possível carregar o relatório deste perfil.</td></tr>`;
            if (window.SupportDeskUI) SupportDeskUI.toast("Erro ao carregar relatório.", "erro");
        }
    }

    function exportarCsv() {
        if (!dadosFiltrados.length) {
            if (window.SupportDeskUI) SupportDeskUI.toast("Não há registros para exportar.", "aviso");
            else alert("Não há registros para exportar.");
            return;
        }

        const cabecalho = perfil === "tecnico"
            ? ["ID", "Solicitante", "Tipo", "Descrição do Problema", "Prioridade", "Status", "Abertura", "Conclusão"]
            : ["ID", "Tipo", "Descrição do Problema", "Prioridade", "Status", "Técnico", "Abertura", "Conclusão"];

        const linhas = dadosFiltrados.map((item) => perfil === "tecnico"
            ? [tratar(item.id_solicitacao), tratar(item.nome_solicitante), tratar(item.tipo_manutencao), tratar(item.descricao), textoPrioridade(item.prioridade), textoStatus(item.status_solicitacao), tratar(item.data_abertura), tratar(item.data_conclusao)]
            : [tratar(item.id_solicitacao), tratar(item.tipo_manutencao), tratar(item.descricao), textoPrioridade(item.prioridade), textoStatus(item.status_solicitacao), tratar(item.nome_tecnico), tratar(item.data_abertura), tratar(item.data_conclusao)]
        );

        const csv = [cabecalho, ...linhas]
            .map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";"))
            .join("\n");

        const arquivo = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement("a");
        link.href = url;
        link.download = perfil === "tecnico" ? "meu-relatorio-tecnico.csv" : "meu-relatorio-solicitante.csv";
        link.click();
        URL.revokeObjectURL(url);

        if (window.SupportDeskUI) SupportDeskUI.toast("CSV exportado com sucesso.", "sucesso");
    }

    function limparFiltros() {
        elementos.busca.value = "";
        elementos.status.value = "";
        elementos.prioridade.value = "";
        aplicarFiltros();
    }

    function carregarDadosUsuario() {
        const rodape = document.getElementById("rodape-usuario");
        if (rodape) {
            rodape.innerHTML = `
                <div class="usuario-box">
                    <span><strong>Usuário:</strong> ${escapeHtml(nomeUsuario)}</span>
                    <span><strong>Tipo:</strong> ${escapeHtml(tipoUsuario)}</span>
                </div>
            `;
        }
    }

    elementos.busca.addEventListener("input", aplicarFiltros);
    elementos.status.addEventListener("change", aplicarFiltros);
    elementos.prioridade.addEventListener("change", aplicarFiltros);
    document.getElementById("btnPerfilAtualizar").addEventListener("click", carregarRelatorioPerfil);
    document.getElementById("btnPerfilExportar").addEventListener("click", exportarCsv);
    document.getElementById("btnPerfilImprimir").addEventListener("click", () => window.print());
    document.getElementById("btnPerfilLimpar").addEventListener("click", limparFiltros);

    carregarDadosUsuario();
    carregarRelatorioPerfil();
})();
