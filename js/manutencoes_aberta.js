const content = document.getElementById("content");
let manutencoesTecnicoBase = [];
let manutencoesTecnicoFiltradas = [];
let filtroStatusTecnico = "";
let modoAtualTecnico = "minhas";
let solicitacaoAtual = null;

function normalizarTecnico(valor) {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function tratarTecnico(valor) {
    return valor === null || valor === undefined || valor === "" ? "-" : valor;
}

function escapeTecnico(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function mostrarCarregandoTecnico(texto = "Carregando manutenções...") {
    content.className = "sd-skeleton-list";
    content.innerHTML = `<div class="sd-skeleton"></div><div class="sd-skeleton"></div><div class="sd-skeleton"></div>`;
    const contador = document.getElementById("contadorManutencoesTecnico");
    if (contador) contador.innerText = texto;
}

async function buscar(status_solicitacao = "aberta") {
    modoAtualTecnico = "abertas";
    mostrarCarregandoTecnico("Carregando chamados abertos...");

    try {
        let url = `https://backend-service-production-e5a3.up.railway.app/Manutencao/solicitacao/testee/${status_solicitacao}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Erro na API");

        const data = await res.json();
        manutencoesTecnicoBase = Array.isArray(data) ? data : [data];
        aplicarFiltrosTecnico();

        if (window.SupportDeskUI) {
            SupportDeskUI.toast("Chamados abertos carregados.", "info");
        }
    } catch (err) {
        content.className = "";
        content.innerHTML = `<div class="sd-empty-state"><strong>Não foi possível carregar</strong><span>${escapeTecnico(err.message)}</span></div>`;
        if (window.SupportDeskUI) SupportDeskUI.toast("Erro ao carregar chamados abertos.", "erro");
    }
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

    switch (normalizarTecnico(status)) {
        case "aberta":
            return "status-aberta aberta";
        case "em andamento":
            return "status-andamento em-andamento";
        case "concluida":
            return "status-concluida concluida";
        case "cancelada":
            return "status-cancelada cancelada";
        default:
            return "";
    }
}

function carregarDadosUsuario() {
    const tipo = localStorage.getItem("tipo_usuario");
    const nome = localStorage.getItem("nome_usuario");
    const rodape = document.getElementById("rodape-usuario");

    if (rodape) {
        rodape.innerHTML = `
            <div class="usuario-box">
                <span><strong>Usuário:</strong> ${escapeTecnico(nome || "N/A")}</span>
                <span><strong>Tipo:</strong> ${escapeTecnico(tipo || "N/A")}</span>
            </div>
        `;
    }

    minhas_manutencoes();
}
window.onload = carregarDadosUsuario;

async function atribuir(id_solicitacao) {
    try {
        const id = JSON.parse(localStorage.getItem("id_usuario"));

        if (!id) {
            alert("Usuário não encontrado");
            return;
        }

        const res = await fetch(`https://backend-service-production-e5a3.up.railway.app/Manutencao/solicitacao/atribuir/tecnico/${id_solicitacao}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_tecnico: id,
                status_solicitacao: "em andamento"
            })
        });

        if (!res.ok) throw new Error("Erro ao atribuir");

        if (window.SupportDeskUI) SupportDeskUI.toast("Solicitação atribuída com sucesso.", "sucesso");
        else alert("Solicitação atribuída!");

        minhas_manutencoes();
    } catch (err) {
        console.error(err);
        if (window.SupportDeskUI) SupportDeskUI.toast(err.message, "erro");
        else alert(err.message);
    }
}

async function marcar_concluido(id_solicitacao) {
    try {
        const id = JSON.parse(localStorage.getItem("id_usuario"));

        if (!id) {
            alert("Usuário não encontrado");
            return;
        }

        const res = await fetch(`https://backend-service-production-e5a3.up.railway.app/Manutencao/solicitacao/atribuir/tecnico/${id_solicitacao}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_tecnico: id,
                status_solicitacao: "concluida"
            })
        });

        if (!res.ok) throw new Error("Erro ao marcar como concluído");

        if (window.SupportDeskUI) SupportDeskUI.toast("Chamado marcado como concluído.", "sucesso");
        else alert("Marcado como concluído!");

        minhas_manutencoes();
    } catch (err) {
        console.error(err);
        if (window.SupportDeskUI) SupportDeskUI.toast(err.message, "erro");
        else alert(err.message);
    }
}

async function marcar_cancelada(id_solicitacao) {
    try {
        const id = JSON.parse(localStorage.getItem("id_usuario"));

        if (!id) {
            alert("Usuário não encontrado");
            return;
        }

        const res = await fetch(`https://backend-service-production-e5a3.up.railway.app/Manutencao/solicitacao/atribuir/tecnico/${id_solicitacao}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_tecnico: id,
                status_solicitacao: "cancelada"
            })
        });

        if (!res.ok) throw new Error("Erro ao marcar como cancelada");

        if (window.SupportDeskUI) SupportDeskUI.toast("Chamado marcado como cancelado.", "sucesso");
        else alert("Marcado como Cancelada!");

        minhas_manutencoes();
    } catch (err) {
        console.error(err);
        if (window.SupportDeskUI) SupportDeskUI.toast(err.message, "erro");
        else alert(err.message);
    }
}

async function minhas_manutencoes() {
    const id_tecnico = localStorage.getItem("id_usuario");
    modoAtualTecnico = "minhas";

    if (!id_tecnico) {
        content.className = "";
        content.innerHTML = `<div class="sd-empty-state"><strong>Usuário não logado</strong><span>Faça login novamente para acessar suas manutenções.</span></div>`;
        return;
    }

    mostrarCarregandoTecnico("Carregando suas manutenções...");

    try {
        let url = `https://backend-service-production-e5a3.up.railway.app/Manutencao/solicitacao/tecnico/${id_tecnico}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Erro na API");

        const data = await res.json();
        manutencoesTecnicoBase = Array.isArray(data) ? data : [data];
        aplicarFiltrosTecnico();
    } catch (err) {
        content.className = "";
        content.innerHTML = `<div class="sd-empty-state"><strong>Não foi possível carregar</strong><span>${escapeTecnico(err.message)}</span></div>`;
        if (window.SupportDeskUI) SupportDeskUI.toast("Erro ao carregar suas manutenções.", "erro");
    }
}

function aplicarFiltrosTecnico() {
    const busca = normalizarTecnico(document.getElementById("buscarManutencaoTecnico")?.value);
    const statusFiltro = normalizarTecnico(filtroStatusTecnico);

    manutencoesTecnicoFiltradas = manutencoesTecnicoBase.filter((item) => {
        const texto = normalizarTecnico([
            item.id_solicitacao,
            item.nome_solicitante,
            item.nome_tecnico,
            item.tipo_manutencao,
            item.descricao,
            item.prioridade,
            item.status_solicitacao,
            item.data_abertura,
            item.solucao,
            item.data_conclusao
        ].join(" "));

        const bateBusca = !busca || texto.includes(busca);
        const bateStatus = !statusFiltro || normalizarTecnico(item.status_solicitacao) === statusFiltro;

        return bateBusca && bateStatus;
    });

    renderizarManutencoesTecnico(manutencoesTecnicoFiltradas);
}

function renderizarManutencoesTecnico(lista) {
    const contador = document.getElementById("contadorManutencoesTecnico");
    if (contador) {
        const origem = modoAtualTecnico === "abertas" ? "chamados abertos" : "minhas manutenções";
        contador.innerText = `${lista.length} de ${manutencoesTecnicoBase.length} ${origem}`;
    }

    if (!manutencoesTecnicoBase.length) {
        content.className = "";
        content.innerHTML = `
            <div class="sd-empty-state">
                <strong>Nenhuma manutenção encontrada</strong>
                <span>${modoAtualTecnico === "abertas" ? "Não há chamados abertos disponíveis no momento." : "Você ainda não possui manutenções atribuídas."}</span>
            </div>`;
        return;
    }

    if (!lista.length) {
        content.className = "";
        content.innerHTML = `
            <div class="sd-empty-state">
                <strong>Nenhum resultado para os filtros</strong>
                <span>Limpe os filtros ou escolha outro status.</span>
            </div>`;
        return;
    }

    content.className = "grid tecnico-grid";
    content.innerHTML = lista.map((item) => {
        const status = normalizarTecnico(item.status_solicitacao);
        const finalizada = status === "cancelada" || status === "concluida";
        const cardClasse = status === "cancelada" ? "card-cancelada" : status === "concluida" ? "card-concluida" : "";
        const titulo = modoAtualTecnico === "abertas" ? "Solicitação de Manutenção" : "Minha Manutenção";
        const id = escapeTecnico(item.id_solicitacao ?? "");

        return `
            <div class="${modoAtualTecnico === "abertas" ? "card" : "my_card"} ${cardClasse}" data-status="${escapeTecnico(status)}" data-solicitacao-id="${id}">
                <div class="title">
                    <span>${titulo} #${escapeTecnico(tratarTecnico(item.id_solicitacao))}</span>
                    <button type="button" class="sd-copy-button" onclick="copiarIdTecnico('${id}')" title="Copiar ID">⧉</button>
                </div>

                <div class="row">
                    <span>Solicitante</span>
                    <span class="value">${escapeTecnico(tratarTecnico(item.nome_solicitante))}</span>
                </div>

                ${modoAtualTecnico === "abertas" ? `
                <div class="row">
                    <span>Técnico Responsável</span>
                    <span class="value">${escapeTecnico(tratarTecnico(item.nome_tecnico))}</span>
                </div>` : ""}

                <div class="row">
                    <span>Tipo Manutenção</span>
                    <span class="value">${escapeTecnico(tratarTecnico(item.tipo_manutencao))}</span>
                </div>

                <div class="row">
                    <span>Descrição</span>
                    <span class="value descricao">${escapeTecnico(tratarTecnico(item.descricao))}</span>
                </div>

                <div class="row">
                    <span>Prioridade</span>
                    <span class="value"><span class="badge ${getPriorityClass(item.prioridade)}">${escapeTecnico(tratarTecnico(item.prioridade))}</span></span>
                </div>

                <div class="row">
                    <span>Status</span>
                    <span class="value"><span class="badge ${getStatusClass(item.status_solicitacao)}">${escapeTecnico(tratarTecnico(item.status_solicitacao))}</span></span>
                </div>

                <div class="row">
                    <span>Data Abertura</span>
                    <span class="value">${escapeTecnico(tratarTecnico(item.data_abertura))}</span>
                </div>

                ${modoAtualTecnico === "minhas" ? `
                    <details class="detalhes-solicitacao">
                        <summary>Visualizar detalhes técnicos</summary>
                        <div class="row">
                            <span>Solução</span>
                            <span class="value">${escapeTecnico(tratarTecnico(item.solucao))}</span>
                        </div>
                        <div class="row">
                            <span>Data Solução</span>
                            <span class="value">${escapeTecnico(tratarTecnico(item.data_conclusao))}</span>
                        </div>
                        <div class="row">
                            <span>Técnico</span>
                            <span class="value">${escapeTecnico(tratarTecnico(item.nome_tecnico))}</span>
                        </div>
                    </details>
                ` : ""}

                <div class="actions">
                    ${modoAtualTecnico === "abertas" ? `
                        <button onclick="atribuir(${item.id_solicitacao})" class="btn-atribuir">👷 Atribuir a mim</button>
                    ` : !finalizada ? `
                        <button onclick="abrirModalChamado(${item.id_solicitacao})" class="btn-atribuir">✅ Marcar como concluído</button>
                        <button onclick="marcar_cancelada(${item.id_solicitacao})" class="btn-atribuir btn-cancelar-card">❌ Marcar como cancelada</button>
                    ` : `
                        <button class="btn-atribuir" disabled>🔒 Finalizada</button>
                    `}
                </div>
            </div>
        `;
    }).join("");

    if (window.SupportDeskUI) SupportDeskUI.decorateBadges(content);
}

function limparFiltrosTecnico() {
    const busca = document.getElementById("buscarManutencaoTecnico");
    if (busca) busca.value = "";
    filtroStatusTecnico = "";
    document.querySelectorAll("#filtrosStatusTecnico .status-filter").forEach((botao) => {
        botao.classList.toggle("active", botao.dataset.status === "");
    });
    aplicarFiltrosTecnico();
}

function copiarIdTecnico(id) {
    if (window.SupportDeskUI) {
        SupportDeskUI.copyText(id, "ID da solicitação");
        return;
    }
    navigator.clipboard?.writeText(String(id || ""));
}

function abrirModalChamado(id_solicitacao) {
    solicitacaoAtual = id_solicitacao;
    const modal = document.getElementById("modalEncerrar");
    modal.style.display = "flex";
    modal.scrollTop = 0;
    document.body.classList.add("sd-modal-open");
    document.getElementById("solucao").value = "";
    document.getElementById("contadorCaracteres").innerText = "0";
}

function fecharModalChamado() {
    const modal = document.getElementById("modalEncerrar");
    modal.style.display = "none";
    document.body.classList.remove("sd-modal-open");
}

document.addEventListener("input", function(e) {
    if (e.target.id === "solucao") {
        document.getElementById("contadorCaracteres").innerText = e.target.value.length;
    }
});

async function encerrarChamado() {
    try {
        const id_tecnico = JSON.parse(localStorage.getItem("id_usuario"));
        const solucao = document.getElementById("solucao").value.trim();

        if (solucao.length < 10) {
            if (window.SupportDeskUI) SupportDeskUI.toast("Descreva melhor a solução antes de finalizar.", "aviso");
            else alert("Descreva melhor a solução.");
            return;
        }

        const res = await fetch(
            `https://backend-service-production-e5a3.up.railway.app/Manutencao/solicitacao/concluir/${solicitacaoAtual}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_tecnico: id_tecnico,
                    status_solicitacao: "concluida",
                    solucao: solucao
                })
            }
        );

        if (!res.ok) throw new Error("Erro ao encerrar chamado");

        if (window.SupportDeskUI) SupportDeskUI.toast("Chamado concluído com sucesso.", "sucesso");
        else alert("Chamado concluído!");

        fecharModalChamado();
        minhas_manutencoes();
    } catch (err) {
        console.error(err);
        if (window.SupportDeskUI) SupportDeskUI.toast(err.message, "erro");
        else alert(err.message);
    }
}

document.getElementById("buscarManutencaoTecnico")?.addEventListener("input", aplicarFiltrosTecnico);

document.querySelectorAll("#filtrosStatusTecnico .status-filter").forEach((botao) => {
    botao.addEventListener("click", () => {
        filtroStatusTecnico = botao.dataset.status || "";
        document.querySelectorAll("#filtrosStatusTecnico .status-filter").forEach((item) => {
            item.classList.toggle("active", item === botao);
        });
        aplicarFiltrosTecnico();
    });
});
