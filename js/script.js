const form = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    try {
        const response = await fetch("https://backend-service-production-ac30.up.railway.app/Manutencao/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                senha: senha
            })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarMensagem("Login realizado com sucesso!", "sucesso");

          
            setTimeout(() => {
                window.location.href = "Gerenciamentos.html";
            }, 1500);

        } else {
            mostrarMensagem(data.mensagem || "Erro ao fazer login", "erro");
        }

    } catch (error) {
        console.error(error);
        mostrarMensagem("Erro ao conectar com o servidor", "erro");
    }
});

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = ""; 
    mensagem.classList.add("show", tipo);
}