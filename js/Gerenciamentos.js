const API_URL = "https://backend-service-production-e5a3.up.railway.app/Manutencao"

async function listarusuarios() {

    const res = await fetch(API_URL);
    const usuarios = await res.json();

    const tabela = document.getElementById("tabelausuarios");
    tabela.innerHTML = "";

    usuarios.forEach(usuarios=> {

        tabela.innerHTML += `
        <tr>
            <td>${usuarios.id_usuario}</td>
            <td>${usuarios.nome}</td>    
            <td>${usuarios.email}</td>
            <td>${usuarios.tipo_usuario}</td> 
            <td>${usuarios.telefone}</td> 
            
            <td>
            <button onclick="abrirEditar(${usuarios.id_usuario}, '${usuarios.nome}', '${usuarios.email}','','${usuarios.tipo_usuario}','${usuarios.telefone}')">Editar</button>
            <button onclick="excluirusuarios(${usuarios.id_usuario})">Excluir</button>
            
            </td>
        </tr>`;
    });
    atualizarDashboard(usuarios); // 👈 chama outra função
}
listarusuarios()

function atualizarDashboard(usuarios) {

    const resumo = usuarios.reduce((acc, usuario) => {

        acc.total++;

        if (usuario.tipo_usuario === "gestor") acc.gestores++;
        if (usuario.tipo_usuario === "manutentor") acc.tecnicos++;
        if (usuario.tipo_usuario === "solicitante") acc.solicitantes++;

        return acc;

    }, {
        total: 0,
        gestores: 0,
        tecnicos: 0,
        solicitantes: 0
    });

    document.getElementById("totalUsuarios").innerText = resumo.total;
    document.getElementById("totalGestores").innerText = resumo.gestores;
    document.getElementById("totalTecnicos").innerText = resumo.tecnicos;
    document.getElementById("totalSolicitantes").innerText = resumo.solicitantes;
}


async function adicionarusuarios() {
    const nome = document.getElementById("nomeAdd").value;
    const email = document.getElementById("emailAdd").value;
    const senha = document.getElementById("senhaAdd").value;
    const tipo_usuario = document.getElementById("tipo_usuarioAdd").value;
    const telefone= document.getElementById("telefoneAdd").value;


    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ nome, email, senha, tipo_usuario, telefone })
    });

    fecharModal("modalAdicionar")
    alert("Adicionado com sucesso");
    listarusuarios()


}
listarusuarios()


async function excluirusuarios(id_usuario) {
    if (!confirm('Deseja realmente excluir?'))return
    await fetch(`${API_URL}/${id_usuario}`, {
        method: "DELETE"
    } )
    alert("Excluido com sucesso");  
    listarusuarios()
};



async function buscarPorIDAluno(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "GET"
    }
    )
};
listarusuarios()


function abrirModalAdicionar() {
    const modal = document.getElementById("modalAdicionar");
    if (!modal) return;
    modal.style.display = "flex";
    modal.scrollTop = 0;
    document.body.classList.add("sd-modal-open");
}

function fecharModal(id_usuario) {
    const modal = document.getElementById(id_usuario);
    if (!modal) return;
    modal.style.display = "none";
    document.body.classList.remove("sd-modal-open");
}

function abrirEditar(id_usuario, nome, email, senha, tipo_usuario, telefone ){
    document.getElementById("idEdit").value = id_usuario;
    document.getElementById("nomeEdit").value = nome;
    document.getElementById("emailEdit").value = email;
    document.getElementById("senhaEdit").value = senha;
    document.getElementById("tipo_usuarioEdit").value = tipo_usuario;
    document.getElementById("telefoneEdit").value = telefone;
    const modal = document.getElementById("modalEditar");
    modal.style.display = "flex";
    modal.scrollTop = 0;
    document.body.classList.add("sd-modal-open");
}



async function editarusuarios() {
        const id_usuario = document.getElementById("idEdit").value;
        const nome = document.getElementById("nomeEdit").value;
        const email = document.getElementById("emailEdit").value;
        const senha = document.getElementById("senhaEdit").value;
        const tipo_usuario= document.getElementById("tipo_usuarioEdit").value;
        const telefone= document.getElementById("telefoneEdit").value;


    await fetch(`${API_URL}/${id_usuario}`, {
        method: "PUT",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ nome, email, senha, tipo_usuario, telefone }) 
    });

    fecharModal("modalEditar");
    listarusuarios()
}
listarusuarios()

function carregarDadosUsuario() {
    const tipo = localStorage.getItem("tipo_usuario");
    const nome = localStorage.getItem("nome_usuario");
    const id = localStorage.getItem("id_usuario");

    const rodape = document.getElementById("rodape-usuario");

    if (rodape) {
        rodape.innerHTML = `
            <div class="usuario-box">
                <span><strong>ID:</strong> ${id || "N/A"}</span>
                <span><strong>Usuário:</strong> ${nome || "N/A"}</span>
                <span><strong>Tipo:</strong> ${tipo || "N/A"}</span>
              </div>
        `;
    }
}
window.onload = carregarDadosUsuario;

function validarFormularioAdd() {

    const form = document.getElementById("formAdd");
  
    if (form.reportValidity()) {
      adicionarusuarios();
    }
  
  }

function validarFormularioEdit() {

    const form = document.getElementById("formEdit");
  
    if (form.reportValidity()) {
      editarusuarios();
    }
  
  }



  
  async function buscarUsuarios(letra) {
    try {
        const response = await fetch(`https://backend-service-production-e5a3.up.railway.app/Manutencao/nome/${letra}`);

        if (!response.ok) {
            throw new Error("Erro na requisição");
        }

        const dados = await response.json();

        console.log(dados);

        return dados;

    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return [];
    }
}

document.getElementById("buscarUsuario").addEventListener("input", async (e) => {
    const valor = e.target.value;

    if (!valor) {
        listarusuarios();
        return;
    }

    const usuarios = await buscarUsuarios(valor);

    const tabela = document.getElementById("tabelausuarios");
    tabela.innerHTML = "";

    usuarios.forEach(u => {
        tabela.innerHTML += `
        <tr>
            <td>${u.id_usuario}</td>
            <td>${u.nome}</td>
            <td>${u.email}</td>
            <td>${u.tipo_usuario}</td>
            <td>${u.telefone}</td>
            <td>
                <button onclick="abrirEditar(${u.id_usuario}, '${u.nome}', '${u.email}', '', '${u.tipo_usuario}', '${u.telefone}')">
                    Editar
                </button>
                <button onclick="excluirusuarios(${u.id_usuario})">
                    Excluir
                </button>
            </td>
        </tr>`;
    });
});