const API_URL = "https://backend-service-production-ac30.up.railway.app/Manutencao/solicitacao/teste";
let solicitacoesGestorBase = [];

function normalizarSolicitacao(valor) {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function classePrioridadeSolicitacao(prioridade) {
    const valor = normalizarSolicitacao(prioridade);
    if (valor === "critica") return "critica priority-critica";
    if (valor === "alta") return "alta priority-alta";
    if (valor === "media") return "media priority-media";
    return "baixa priority-baixa";
}

function classeStatusSolicitacao(status) {
    const valor = normalizarSolicitacao(status);
    if (valor === "aberta") return "aberta status-aberta";
    if (valor === "em andamento") return "em-andamento status-andamento";
    if (valor === "concluida") return "concluida status-concluida";
    if (valor === "cancelada") return "cancelada status-cancelada";
    return "";
}

function textoPrioridadeSolicitacao(prioridade) {
    const valor = normalizarSolicitacao(prioridade);
    if (valor === "critica") return "Crítica";
    if (valor === "alta") return "Alta";
    if (valor === "media") return "Média";
    if (valor === "baixa") return "Baixa";
    return prioridade || "-";
}

function textoStatusSolicitacao(status) {
    const valor = normalizarSolicitacao(status);
    if (valor === "aberta") return "Aberta";
    if (valor === "em andamento") return "Em andamento";
    if (valor === "concluida") return "Concluída";
    if (valor === "cancelada") return "Cancelada";
    return status || "-";
}

async function listarsolicitacoes() {

    const tabela = document.getElementById("tabelasolicitacoes");
    tabela.innerHTML = `<tr><td colspan="9">Carregando solicitações...</td></tr>`;

    const res = await fetch(API_URL);
    solicitacoesGestorBase = await res.json();
    aplicarBuscaSolicitacoesGestor();
}
listarsolicitacoes();

async function adicionarsolicitacoes() {
    const id_solicitante = document.getElementById("solicitanteAdd").value;
    const tipo_manutencao = document.getElementById("tipoAdd").value;
    const descricao = document.getElementById("descricaoAdd").value;
    const prioridade = document.getElementById("prioridadeAdd").value;
    const status_solicitacao = document.getElementById("statusAdd").value;
    const id_tecnico = document.getElementById("tecnicoAdd").value || null; /* Se nao vim preenchido prencher com nulo*/



    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_solicitante, tipo_manutencao, descricao, prioridade, status_solicitacao, id_tecnico })
    });
    console.log(id_solicitante, tipo_manutencao, descricao, prioridade, status_solicitacao);
    fecharModal("modalAdicionar");
    alert("Adicionado com sucesso");
    listarsolicitacoes();


}
listarsolicitacoes();


async function excluir(id) {
    if (!confirm('Deseja realmente excluir?')) return
    await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    })
    alert("Excluido com sucesso");
    listarsolicitacoes();
};



async function buscarPorIDAluno(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "GET"
    }
    )
};
listarsolicitacoes();


function abrirModalAdicionar() {
    const modal = document.getElementById("modalAdicionar");
    if (!modal) return;
    modal.style.display = "flex";
    modal.scrollTop = 0;
    document.body.classList.add("sd-modal-open");
}

function fecharModal(id_solicitacao) {
    const modal = document.getElementById(id_solicitacao);
    if (!modal) return;
    modal.style.display = "none";
    document.body.classList.remove("sd-modal-open");
}

function abrirEditar(id_solicitacao, id_solicitante, tipo_manutencao, descricao, prioridade, status_solicitacao) {
    document.getElementById("idEdit").value = id_solicitacao;
    document.getElementById("solicitanteAdd").value = id_solicitante;
    document.getElementById("tipoEdit").value = tipo_manutencao;
    document.getElementById("descricaoEdit").value = descricao;
    document.getElementById("prioridadeEdit").value = prioridade;
    document.getElementById("statusEdit").value = status_solicitacao;
    const modal = document.getElementById("modalEditar");
    modal.style.display = "flex";
    modal.scrollTop = 0;
    document.body.classList.add("sd-modal-open");
    carregarSolicitantes('solicitante', 'solicitanteEdit')
    carregarSolicitantes('gestor', 'solicitanteEdit')
    carregarSolicitantes('manutentor', 'tecnicoEdit')
}



async function editarsolicitacoes() {
    const id = document.getElementById("idEdit").value;
    const id_solicitante = document.getElementById("solicitanteEdit").value;
    const tipo_manutencao = document.getElementById("tipoEdit").value;
    const descricao = document.getElementById("descricaoEdit").value;
    const prioridade = document.getElementById("prioridadeEdit").value;
    const status_solicitacao = document.getElementById("statusEdit").value

    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ id, id_solicitante, tipo_manutencao, descricao, prioridade, status_solicitacao })
    });

    fecharModal("modalEditar");
    listarsolicitacoes();
}
listarsolicitacoes();


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
window.onload = carregarDadosUsuario;

async function carregarSolicitantes(tipo, selectId) {
    try {
        const response = await fetch(`https://backend-service-production-ac30.up.railway.app/Manutencao/${tipo}`);
        const dados = await response.json();

        const select = document.getElementById(selectId);

        // cria controle interno no próprio select
        if (!select.dataset.iniciado) {
            select.innerHTML = `<option value="">Selecione</option>`;
            select.dataset.iniciado = "true";
        }

        dados.forEach(u => {
            // evita duplicar opções (caso chame mais de um tipo no mesmo select)
            const existe = [...select.options].some(opt => opt.value == u.id_usuario);

            if (!existe) {
                select.innerHTML += `
            <option value="${u.id_usuario}">
              ${u.nome}
            </option>
          `;
            }
        });

    } catch (error) {
        console.error("Erro ao carregar solicitantes:", error);
    }
}

/*Filtro*/

function filtrarSolicitacoesGestorPorTexto(lista) {
    const busca = normalizarSolicitacao(document.getElementById("buscarSolicitacoesGestor")?.value);

    if (!busca) return lista;

    return lista.filter(item => normalizarSolicitacao([
        item.id_solicitacao,
        item.nome_solicitante,
        item.tipo_manutencao,
        item.descricao,
        item.prioridade,
        item.status_solicitacao,
        item.nome_tecnico
    ].join(" ")).includes(busca));
}

function aplicarBuscaSolicitacoesGestor() {
    const lista = filtrarSolicitacoesGestorPorTexto(solicitacoesGestorBase);
    renderTabela(lista);

    const contador = document.getElementById("contadorSolicitacoesGestor");
    if (contador) {
        contador.innerText = `${lista.length} de ${solicitacoesGestorBase.length} solicitaç${lista.length === 1 ? "ão" : "ões"}`;
    }
}

function limparBuscaSolicitacoesGestor() {
    const busca = document.getElementById("buscarSolicitacoesGestor");
    if (busca) busca.value = "";
    aplicarBuscaSolicitacoesGestor();
}

function toggleFiltro() {
    const menu = document.getElementById("menuFiltro");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function filtrar(status_solicitacao) {
    fetch(`https://backend-service-production-ac30.up.railway.app/Manutencao/solicitacao/filtro/${status_solicitacao}`)
        .then(res => res.json())
        .then(data => {
            solicitacoesGestorBase = Array.isArray(data) ? data : [data];
            aplicarBuscaSolicitacoesGestor();
        })
        .catch(err => console.error(err));
}



function renderTabela(data) {
    const tabela = document.getElementById("tabelasolicitacoes");
    tabela.innerHTML = "";

    if (!data.length) {
        tabela.innerHTML = `<tr><td colspan="9">Nenhuma solicitação encontrada.</td></tr>`;
        return;
    }

    const tratar = (valor) => {
        return (valor === null || valor === undefined || valor === "") ? "-" : valor;
    };

    data.forEach(item => {
        tabela.innerHTML += `
            <tr>
                <td>${tratar(item.id_solicitacao)}</td>
                <td>${tratar(item.nome_solicitante)}</td>
                <td>${tratar(item.tipo_manutencao)}</td>
                <td>${tratar(item.descricao)}</td>
                <td><span class="badge badge-prioridade ${classePrioridadeSolicitacao(item.prioridade)}">${textoPrioridadeSolicitacao(item.prioridade)}</span></td>
                <td><span class="badge badge-status ${classeStatusSolicitacao(item.status_solicitacao)}">${textoStatusSolicitacao(item.status_solicitacao)}</span></td>
                <td>${tratar(item.nome_tecnico)}</td>
                <td>
                    ${item.status_solicitacao === "concluida"
                        ? `
                            <button class="btn-olho"
                                onclick="abrirModalSolucao(
                                    '${tratar(item.solucao)}',
                                    '${tratar(item.data_conclusao)}'
                                )">
                                👁
                            </button>
                          `
                        : `
                            <button class="btn-olho-desabilitado">
                                👁
                            </button>
                          `
                    }
                </td>
                <td>
                    <button onclick="abrirEditar(
                        ${item.id_solicitacao},
                        ${item.id_solicitante},
                        '${tratar(item.tipo_manutencao)}',
                        '${tratar(item.descricao)}',
                        '${tratar(item.prioridade)}',
                        '${tratar(item.status_solicitacao)}'
                    )">Editar</button>
                    <button onclick="excluir(${item.id_solicitacao})">Excluir</button>
                </td>
            </tr>
        `;
    });
}

document.getElementById("buscarSolicitacoesGestor")?.addEventListener("input", aplicarBuscaSolicitacoesGestor);
document.getElementById("btnLimparBuscaSolicitacoes")?.addEventListener("click", limparBuscaSolicitacoesGestor);

document.addEventListener("click", function (evento) {

    const menuFiltro = document.getElementById("menuFiltro");
    const botaoFiltro = document.querySelector(".filtro-btn");

    if (!menuFiltro || !botaoFiltro) return;

    const clicouNoBotao = botaoFiltro.contains(evento.target);
    const clicouNoMenu = menuFiltro.contains(evento.target);

    if (!clicouNoBotao && !clicouNoMenu) {
        menuFiltro.style.display = "none";
    }

});

function validarFormularioAdd() {

    const form = document.getElementById("formSolicitacaoAdd");
    console.log(form)
    if (form.reportValidity()) {
        adicionarsolicitacoes();
    }
}


function validarFormularioEdit() {

    const form = document.getElementById("formSolicitacaoEdit");

    if (form.reportValidity()) {
        editarsolicitacoes();
    }

}

function abrirModalSolucao(solucao, data) {

    document.getElementById("textoSolucao").innerText = solucao;
    document.getElementById("dataSolucao").innerText = data;

    const modal = document.getElementById("modalSolucao");
    modal.style.display = "flex";
    modal.scrollTop = 0;
    document.body.classList.add("sd-modal-open");
}