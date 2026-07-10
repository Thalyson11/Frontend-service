const form = document.getElementById('loginForm');
const mensagem = document.getElementById('mensagem');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('usuario').value;
    const password = document.getElementById('senha').value;

    try {
        const response = await fetch("https://backend-service-production-e5a3.up.railway.app/Manutencao/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                senha: password
            })
        });

        const data = await response.json();

        // Limpa classes antes de aplicar novas
        mensagem.classList.remove("sucesso", "erro", "show");

        if (response.ok) {
            mensagem.textContent = data.message;
            mensagem.classList.add("sucesso", "show");

            const tipo = data?.dados?.tipo_usuario?.toLowerCase();

            if (!tipo) {
                mensagem.textContent = "Tipo de usuário não encontrado.";
                mensagem.classList.remove("sucesso");
                mensagem.classList.add("erro");
                return;
            }

            // Salva no navegador
            localStorage.setItem("tipo_usuario", tipo);
            localStorage.setItem("nome_usuario", data.dados.nome);
            localStorage.setItem("id_usuario", data.dados.id_usuario);

            // Redireciona
            redirecionarUsuario(tipo);

        } else {
            mensagem.textContent = data.message;
            mensagem.classList.add("erro", "show");
        }

    } catch (error) {
        console.error('Erro:', error);

        mensagem.classList.remove("sucesso");
        mensagem.textContent = 'Erro ao conectar com o servidor.';
        mensagem.classList.add("erro", "show");
    }
});

// Função de redirecionamento
function redirecionarUsuario(tipo) {
    switch (tipo) {
        case "solicitante":
            window.location.href = "minhas_solicitacoes.html";
            break;

        case "gestor":
            window.location.href = "Dashboard.html";
            break;

        case "manutentor":
            window.location.href = "manutencoes_aberta.html";
            break;

        default:
            window.location.href = "home.html";
            break;
    }
}