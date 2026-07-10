const STORAGE_KEY = "supportdesk_funcionalidades_v1";

const funcionalidadesPadrao = [
    {
        id: 1,
        nome: "Login por perfil",
        modulo: "Autenticação",
        status: "Ativa",
        descricao: "Redireciona gestor, solicitante e técnico para seus respectivos painéis após o login."
    },
    {
        id: 2,
        nome: "Gestão de solicitações",
        modulo: "Gestor",
        status: "Ativa",
        descricao: "Permite cadastrar, editar, excluir, filtrar e visualizar solicitações de manutenção."
    },
    {
        id: 3,
        nome: "Gestão de usuários",
        modulo: "Gestor",
        status: "Ativa",
        descricao: "Permite controlar usuários, tipos de acesso, e dados de contato."
    },
    {
        id: 4,
        nome: "Minhas solicitações",
        modulo: "Solicitante",
        status: "Ativa",
        descricao: "Permite que o solicitante registre chamados e acompanhe o andamento."
    },
    {
        id: 5,
        nome: "Painel técnico",
        modulo: "Técnico",
        status: "Ativa",
        descricao: "Permite atribuir manutenções, concluir chamados e registrar a solução aplicada."
    },
    {
        id: 6,
        nome: "Relatórios gerenciais",
        modulo: "Gestor",
        status: "Ativa",
        descricao: "Mostra indicadores, filtros, impressão e exportação CSV usando dados já existentes da API."
    }
];

let funcionalidades = carregarFuncionalidades();
let filtroAtual = "";

const formPanel = document.getElementById("formPanel");
const form = document.getElementById("formFuncionalidade");
const campoId = document.getElementById("funcionalidadeId");
const campoNome = document.getElementById("nomeFuncionalidade");
const campoModulo = document.getElementById("moduloFuncionalidade");
const campoStatus = document.getElementById("statusFuncionalidade");
const campoDescricao = document.getElementById("descricaoFuncionalidade");
const tabela = document.getElementById("tabelaFuncionalidades");
const busca = document.getElementById("buscarFuncionalidade");

function carregarFuncionalidades() {
    const salvas = localStorage.getItem(STORAGE_KEY);

    if (!salvas) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(funcionalidadesPadrao));
        return [...funcionalidadesPadrao];
    }

    try {
        return JSON.parse(salvas);
    } catch (error) {
        console.error("Erro ao carregar funcionalidades:", error);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(funcionalidadesPadrao));
        return [...funcionalidadesPadrao];
    }
}

function salvarFuncionalidades() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(funcionalidades));
}

function normalizar(valor) {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function abrirFormulario() {
    formPanel.classList.add("open");
    campoNome.focus();
}

function fecharFormulario() {
    form.reset();
    campoId.value = "";
    campoStatus.value = "Ativa";
    formPanel.classList.remove("open");
    document.getElementById("btnSalvarFuncionalidade").innerText = "Salvar Funcionalidade";
}

function classeStatus(status) {
    const valor = normalizar(status);
    if (valor === "ativa") return "ativa";
    if (valor === "em melhoria") return "melhoria";
    return "planejada";
}

function obterFuncionalidadesFiltradas() {
    if (!filtroAtual) return funcionalidades;

    return funcionalidades.filter(item => {
        const texto = normalizar(`${item.nome} ${item.modulo} ${item.status} ${item.descricao}`);
        return texto.includes(filtroAtual);
    });
}

function atualizarMetricas() {
    const total = funcionalidades.length;
    const ativas = funcionalidades.filter(item => normalizar(item.status) === "ativa").length;
    const melhoria = funcionalidades.filter(item => normalizar(item.status) === "em melhoria").length;
    const planejadas = funcionalidades.filter(item => normalizar(item.status) === "planejada").length;

    document.getElementById("totalFuncionalidades").innerText = total;
    document.getElementById("totalAtivas").innerText = ativas;
    document.getElementById("totalMelhoria").innerText = melhoria;
    document.getElementById("totalPlanejadas").innerText = planejadas;
}

function renderizarFuncionalidades() {
    const lista = obterFuncionalidadesFiltradas();
    document.getElementById("contadorResultados").innerText = `${lista.length} funcionalidade${lista.length === 1 ? "" : "s"} encontrada${lista.length === 1 ? "" : "s"}`;

    if (!lista.length) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5">Nenhuma funcionalidade encontrada.</td>
            </tr>
        `;
        atualizarMetricas();
        return;
    }

    tabela.innerHTML = lista.map(item => `
        <tr>
            <td><strong>${item.nome}</strong></td>
            <td>${item.modulo}</td>
            <td><span class="badge ${classeStatus(item.status)}">${item.status}</span></td>
            <td>${item.descricao}</td>
            <td>
                <div class="actions">
                    <button type="button" onclick="editarFuncionalidade(${item.id})">Editar</button>
                    <button type="button" class="danger-button" onclick="excluirFuncionalidade(${item.id})">Excluir</button>
                </div>
            </td>
        </tr>
    `).join("");

    atualizarMetricas();
}

function salvarFormulario(event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const idAtual = Number(campoId.value);
    const dados = {
        id: idAtual || Date.now(),
        nome: campoNome.value.trim(),
        modulo: campoModulo.value,
        status: campoStatus.value,
        descricao: campoDescricao.value.trim()
    };

    if (idAtual) {
        funcionalidades = funcionalidades.map(item => item.id === idAtual ? dados : item);
    } else {
        funcionalidades.push(dados);
    }

    salvarFuncionalidades();
    fecharFormulario();
    renderizarFuncionalidades();
}

function editarFuncionalidade(id) {
    const item = funcionalidades.find(funcionalidade => funcionalidade.id === id);
    if (!item) return;

    campoId.value = item.id;
    campoNome.value = item.nome;
    campoModulo.value = item.modulo;
    campoStatus.value = item.status;
    campoDescricao.value = item.descricao;
    document.getElementById("btnSalvarFuncionalidade").innerText = "Atualizar Funcionalidade";
    abrirFormulario();
}

function excluirFuncionalidade(id) {
    const item = funcionalidades.find(funcionalidade => funcionalidade.id === id);
    if (!item) return;

    if (!confirm(`Deseja excluir a funcionalidade "${item.nome}"?`)) return;

    funcionalidades = funcionalidades.filter(funcionalidade => funcionalidade.id !== id);
    salvarFuncionalidades();
    renderizarFuncionalidades();
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

document.getElementById("btnNovaFuncionalidade").addEventListener("click", abrirFormulario);
document.getElementById("btnCancelarEdicao").addEventListener("click", fecharFormulario);
form.addEventListener("submit", salvarFormulario);
busca.addEventListener("input", () => {
    filtroAtual = normalizar(busca.value);
    renderizarFuncionalidades();
});

carregarDadosUsuario();
renderizarFuncionalidades();
