(function () {
    const STORAGE_THEME = "supportdesk_theme";
    const STORAGE_SEARCHES = "supportdesk_search_history";
    const PAGE_SIZE = 8;
    const tableStates = new WeakMap();

    const normalizar = (valor) => String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const escapeHtml = (valor) => String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function getUserFooterHtml() {
        const nome = localStorage.getItem("nome_usuario") || "N/A";
        const tipo = localStorage.getItem("tipo_usuario") || "N/A";
        const id = localStorage.getItem("id_usuario") || "N/A";
        const current = location.pathname.split("/").pop();
        const mostrarId = current === "Gerenciamentos.html";
        return `
            <div class="usuario-box" aria-label="Usuário logado">
                ${mostrarId ? `<span><strong>ID:</strong> ${escapeHtml(id)}</span>` : ""}
                <span><strong>Usuário:</strong> ${escapeHtml(nome)}</span>
                <span><strong>Tipo:</strong> ${escapeHtml(tipo)}</span>
            </div>
        `;
    }

    function syncUserFooter() {
        const rodape = document.getElementById("rodape-usuario");
        if (!rodape) return;
        const html = getUserFooterHtml();
        if (rodape.innerHTML.trim() !== html.trim()) {
            rodape.innerHTML = html;
        }
    }

    function toast(mensagem, tipo = "info", titulo) {
        let container = document.querySelector(".sd-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "sd-toast-container";
            document.body.appendChild(container);
        }

        const titulos = {
            sucesso: "Sucesso",
            erro: "Erro",
            aviso: "Atenção",
            info: "Informação"
        };

        const icons = {
            sucesso: "✓",
            erro: "!",
            aviso: "⚠",
            info: "i"
        };

        const el = document.createElement("div");
        el.className = `sd-toast ${tipo}`;
        el.setAttribute("role", tipo === "erro" ? "alert" : "status");
        el.innerHTML = `
            <span aria-hidden="true">${icons[tipo] || icons.info}</span>
            <div>
                <strong>${escapeHtml(titulo || titulos[tipo] || titulos.info)}</strong>
                <p>${escapeHtml(mensagem)}</p>
            </div>
            <button type="button" aria-label="Fechar aviso">×</button>
        `;

        const close = () => {
            el.style.opacity = "0";
            el.style.transform = "translateX(14px)";
            setTimeout(() => el.remove(), 170);
        };

        el.querySelector("button").addEventListener("click", close);
        container.appendChild(el);
        setTimeout(close, 4200);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_THEME, theme);
        const btn = document.querySelector(".sd-theme-toggle");
        if (btn) {
            btn.textContent = theme === "dark" ? "☀" : "☾";
            btn.setAttribute("aria-label", theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
        }
    }

    function setupThemeToggle() {
        const current = localStorage.getItem(STORAGE_THEME) || "light";
        applyTheme(current);

        if (document.querySelector(".sd-theme-toggle")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "sd-theme-toggle";
        button.title = "Alternar tema claro/escuro";
        button.addEventListener("click", () => {
            const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
            applyTheme(next);
            toast(next === "dark" ? "Tema escuro ativado." : "Tema claro ativado.", "info", "Preferência salva");
        });
        document.body.appendChild(button);
        applyTheme(current);
    }

    function setupBackTop() {
        if (document.querySelector(".sd-back-top")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "sd-back-top";
        button.textContent = "↑";
        button.title = "Voltar ao topo";
        button.setAttribute("aria-label", "Voltar ao topo");
        button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        document.body.appendChild(button);

        const toggle = () => button.classList.toggle("visible", window.scrollY > 280);
        window.addEventListener("scroll", toggle, { passive: true });
        toggle();
    }

    function setupBreadcrumb() {
        const main = document.querySelector("main");
        const header = document.querySelector(".page-header, .top-header");
        if (!main || !header || main.querySelector(".sd-breadcrumb")) return;

        const pageTitle = document.querySelector("h1")?.textContent?.trim() || document.title || "Página";
        const current = location.pathname.split("/").pop();
        let inicioHref = "Dashboard.html";
        let inicioLabel = "Início";

        if (["minhas_solicitacoes.html", "RelatorioSolicitante.html"].includes(current)) {
            inicioHref = "minhas_solicitacoes.html";
            inicioLabel = "Central do Solicitante";
        }

        if (["manutencoes_aberta.html", "RelatorioTecnico.html"].includes(current)) {
            inicioHref = "manutencoes_aberta.html";
            inicioLabel = "Central do Técnico";
        }

        const crumb = document.createElement("nav");
        crumb.className = "sd-breadcrumb";
        crumb.setAttribute("aria-label", "Caminho da página");
        crumb.innerHTML = `<a href="${inicioHref}">${inicioLabel}</a><span>/</span><strong>${escapeHtml(pageTitle)}</strong>`;
        main.insertBefore(crumb, header);
    }

    function markActiveMenu() {
        const current = location.pathname.split("/").pop() || "index.html";
        document.querySelectorAll(".sidebar a, .menu a, .mobile-menu a").forEach((link) => {
            const href = link.getAttribute("href") || "";
            if (!href || href === "#") return;
            const page = href.split("/").pop();
            if (page === current) link.classList.add("active");
        });
    }

    function decorateBadges(root = document) {
        const priorities = {
            baixa: "baixa priority-baixa",
            media: "media priority-media",
            média: "media priority-media",
            alta: "alta priority-alta",
            critica: "critica priority-critica",
            crítica: "critica priority-critica"
        };
        const statuses = {
            aberta: "aberta status-aberta",
            "em andamento": "em-andamento status-andamento",
            concluida: "concluida status-concluida",
            concluída: "concluida status-concluida",
            cancelada: "cancelada status-cancelada"
        };

        root.querySelectorAll(".badge, .badge-status, .badge-prioridade").forEach((badge) => {
            const text = normalizar(badge.textContent);
            const rawText = badge.textContent.trim().toLowerCase();
            const priority = priorities[text] || priorities[rawText];
            const status = statuses[text] || statuses[rawText];
            if (priority) badge.classList.add(...priority.split(" "));
            if (status) badge.classList.add(...status.split(" "));
        });
    }

    async function copyText(value, label = "informação") {
        const text = String(value || "").trim();
        if (!text || text === "------" || text === "-") {
            toast(`Não há ${label} para copiar.`, "aviso");
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const temp = document.createElement("textarea");
                temp.value = text;
                temp.style.position = "fixed";
                temp.style.opacity = "0";
                document.body.appendChild(temp);
                temp.select();
                document.execCommand("copy");
                temp.remove();
            }
            toast(`${label} copiado: ${text}`, "sucesso");
        } catch (error) {
            toast(`Não foi possível copiar ${label}.`, "erro");
        }
    }

    function addCopyButtons(table) {
        const headers = [...table.querySelectorAll("thead th")].map((th) => normalizar(th.textContent));
        const copyIndexes = headers
            .map((text, index) => ({ text, index }))
            .filter(({ text }) => text === "id" || text.includes("patrimonio"))
            .map(({ index }) => index);

        if (!copyIndexes.length) return;

        table.querySelectorAll("tbody tr").forEach((row) => {
            if (row.children.length <= 1) return;
            copyIndexes.forEach((index) => {
                const cell = row.children[index];
                if (!cell || cell.querySelector(".sd-copy-button")) return;
                const originalText = [...cell.childNodes]
                    .filter((node) => node.nodeType === Node.TEXT_NODE)
                    .map((node) => node.textContent)
                    .join(" ")
                    .trim() || cell.textContent.trim();

                const label = headers[index].includes("patrimonio") ? "patrimônio" : "ID";
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "sd-copy-button";
                btn.title = `Copiar ${label}`;
                btn.textContent = "⧉";
                btn.addEventListener("click", (event) => {
                    event.stopPropagation();
                    copyText(originalText, label);
                });
                cell.appendChild(btn);
            });
        });
    }

    function tableToRows(table) {
        return [...table.querySelectorAll("tbody tr")].filter((row) => row.children.length > 1 && !row.hidden);
    }

    function exportTableCsv(table) {
        const headers = [...table.querySelectorAll("thead th")].map((th) => th.textContent.replace(/[↕↑↓]/g, "").trim());
        const rows = [...table.querySelectorAll("tbody tr")].filter((row) => row.style.display !== "none" && row.children.length > 1);

        if (!rows.length) {
            toast("Não há registros visíveis para exportar.", "aviso");
            return;
        }

        const data = rows.map((row) => [...row.children].map((cell) => {
            const copy = cell.cloneNode(true);
            copy.querySelectorAll("button").forEach((btn) => btn.remove());
            return copy.textContent.replace(/\s+/g, " ").trim();
        }));

        const csv = [headers, ...data]
            .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
            .join("\n");

        const file = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(document.title || "tabela").toLowerCase().replace(/\s+/g, "-")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast("Arquivo CSV gerado com sucesso.", "sucesso");
    }

    function sortRows(table, columnIndex, direction) {
        const tbody = table.querySelector("tbody");
        const rows = [...tbody.querySelectorAll("tr")].filter((row) => row.children.length > 1);
        const multiplier = direction === "asc" ? 1 : -1;

        rows.sort((a, b) => {
            const aText = a.children[columnIndex]?.textContent.replace(/⧉/g, "").trim() || "";
            const bText = b.children[columnIndex]?.textContent.replace(/⧉/g, "").trim() || "";
            const aNum = Number(aText.replace(",", "."));
            const bNum = Number(bText.replace(",", "."));
            if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return (aNum - bNum) * multiplier;
            return aText.localeCompare(bText, "pt-BR", { numeric: true, sensitivity: "base" }) * multiplier;
        });

        rows.forEach((row) => tbody.appendChild(row));
    }

    function enhanceTable(table) {
        if (!table.querySelector("thead") || !table.querySelector("tbody")) return;

        let state = tableStates.get(table);
        if (!state) {
            state = { page: 1, sortIndex: null, sortDirection: "asc", applying: false };
            tableStates.set(table, state);
        }

        const wrapper = table.closest(".table-wrapper") || table.parentElement;
        if (!wrapper) return;

        let toolbar = wrapper.previousElementSibling;
        if (!toolbar || !toolbar.classList.contains("sd-table-toolbar")) {
            toolbar = document.createElement("div");
            toolbar.className = "sd-table-toolbar";
            toolbar.innerHTML = `
                <span class="sd-table-counter">0 registros</span>
                <div class="sd-table-actions">
                    <button type="button" class="secondary-button sd-export-table">Exportar CSV</button>
                    <button type="button" class="secondary-button sd-print-table">Imprimir</button>
                </div>
            `;
            wrapper.parentElement.insertBefore(toolbar, wrapper);
            toolbar.querySelector(".sd-export-table").addEventListener("click", () => exportTableCsv(table));
            toolbar.querySelector(".sd-print-table").addEventListener("click", () => window.print());
        }

        let pagination = wrapper.nextElementSibling;
        if (!pagination || !pagination.classList.contains("sd-pagination")) {
            pagination = document.createElement("div");
            pagination.className = "sd-pagination";
            pagination.innerHTML = `
                <button type="button" class="secondary-button sd-prev">Anterior</button>
                <span>1 de 1</span>
                <button type="button" class="secondary-button sd-next">Próxima</button>
            `;
            wrapper.parentElement.insertBefore(pagination, wrapper.nextSibling);
            pagination.querySelector(".sd-prev").addEventListener("click", () => {
                state.page = Math.max(1, state.page - 1);
                apply();
            });
            pagination.querySelector(".sd-next").addEventListener("click", () => {
                state.page += 1;
                apply();
            });
        }

        table.querySelectorAll("thead th").forEach((th, index) => {
            if (th.dataset.sdSortReady) return;
            th.dataset.sdSortReady = "true";
            th.classList.add("sd-sortable");
            th.title = "Clique para ordenar";
            th.addEventListener("click", () => {
                if (state.sortIndex === index) {
                    state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
                } else {
                    state.sortIndex = index;
                    state.sortDirection = "asc";
                }
                table.querySelectorAll("th").forEach((item) => item.classList.remove("sort-asc", "sort-desc"));
                th.classList.add(state.sortDirection === "asc" ? "sort-asc" : "sort-desc");
                sortRows(table, index, state.sortDirection);
                state.page = 1;
                apply();
            });
        });

        function apply() {
            if (state.applying) return;
            state.applying = true;
            decorateBadges(table);
            addCopyButtons(table);

            const rows = [...table.querySelectorAll("tbody tr")].filter((row) => row.children.length > 1);
            const total = rows.length;
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            state.page = Math.min(Math.max(1, state.page), totalPages);
            const start = (state.page - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;

            rows.forEach((row, index) => {
                row.style.display = index >= start && index < end ? "" : "none";
            });

            toolbar.querySelector(".sd-table-counter").textContent = `${total} registro${total === 1 ? "" : "s"}`;
            pagination.querySelector("span").textContent = `${state.page} de ${totalPages}`;
            pagination.querySelector(".sd-prev").disabled = state.page <= 1;
            pagination.querySelector(".sd-next").disabled = state.page >= totalPages;
            pagination.style.display = total > PAGE_SIZE ? "flex" : "none";
            toolbar.style.display = total > 0 ? "flex" : "none";
            state.applying = false;
        }

        if (!state.observer) {
            state.observer = new MutationObserver(() => {
                clearTimeout(state.timer);
                state.timer = setTimeout(() => {
                    state.page = 1;
                    apply();
                }, 50);
            });
            state.observer.observe(table.querySelector("tbody"), { childList: true, subtree: true });
        }

        apply();
    }

    function setupTables() {
        document.querySelectorAll("table").forEach(enhanceTable);
    }

    function setupKeyboardShortcuts() {
        document.addEventListener("keydown", (event) => {
            const target = event.target;
            const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

            if (event.key === "/" && !isTyping) {
                const input = document.querySelector('input[type="search"], input[id*="buscar"], input[id*="busca"]');
                if (input) {
                    event.preventDefault();
                    input.focus();
                }
            }

            if (event.altKey && event.key.toLowerCase() === "n") {
                const addButton = [...document.querySelectorAll("button, a")].find((el) => /novo|nova|adicionar/i.test(el.textContent));
                if (addButton) {
                    event.preventDefault();
                    addButton.click();
                }
            }

            if (event.altKey && event.key.toLowerCase() === "r") {
                const refreshButton = [...document.querySelectorAll("button")].find((el) => /atualizar/i.test(el.textContent));
                if (refreshButton) {
                    event.preventDefault();
                    refreshButton.click();
                }
            }

            if (event.key === "Escape") {
                let fechouModal = false;
                document.querySelectorAll('.modal, .modal-overlay').forEach((modal) => {
                    if (getComputedStyle(modal).display !== "none") {
                        modal.style.display = "none";
                        fechouModal = true;
                    }
                });
                if (fechouModal) document.body.classList.remove("sd-modal-open");
            }
        });
    }

    function setupInputHistory() {
        document.querySelectorAll('input[id*="buscar"], input[id*="busca"]').forEach((input) => {
            if (input.dataset.sdHistoryReady) return;
            input.dataset.sdHistoryReady = "true";
            input.title = "Digite para pesquisar. Atalho: /";

            input.addEventListener("change", () => {
                const value = input.value.trim();
                if (!value || value.length < 2) return;
                const history = JSON.parse(localStorage.getItem(STORAGE_SEARCHES) || "[]");
                const next = [value, ...history.filter((item) => item !== value)].slice(0, 6);
                localStorage.setItem(STORAGE_SEARCHES, JSON.stringify(next));
                renderSearchHistory();
            });
        });
        renderSearchHistory();
    }

    function renderSearchHistory() {
        const containers = document.querySelectorAll(".local-search-history");
        if (!containers.length) return;
        const history = JSON.parse(localStorage.getItem(STORAGE_SEARCHES) || "[]");
        containers.forEach((container) => {
            container.innerHTML = history.length
                ? history.map((item) => `<button type="button" class="search-pill">${escapeHtml(item)}</button>`).join("")
                : "";
            container.querySelectorAll(".search-pill").forEach((button) => {
                button.addEventListener("click", () => {
                    const input = document.querySelector('input[id*="buscar"], input[id*="busca"]');
                    if (!input) return;
                    input.value = button.textContent;
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    input.focus();
                });
            });
        });
    }

    function setupTooltips() {
        document.querySelectorAll("button:not([title]), a:not([title]), input:not([title]), select:not([title])").forEach((el) => {
            const text = el.getAttribute("aria-label") || el.textContent?.trim() || el.placeholder;
            if (text) el.title = text.replace(/\s+/g, " ").trim();
        });
    }

    function setupLastUpdate() {
        const header = document.querySelector(".page-header, .top-header");
        if (!header || header.querySelector(".sd-last-update")) return;
        const wrap = document.createElement("div");
        wrap.className = "sd-header-extra";
        wrap.innerHTML = `<span class="sd-last-update">Última atualização: ${new Date().toLocaleString("pt-BR")}</span>`;
        const firstBlock = header.querySelector("div") || header;
        firstBlock.appendChild(wrap);
    }

    function observeDynamicContent() {
        const observer = new MutationObserver(() => {
            clearTimeout(observeDynamicContent.timer);
            observeDynamicContent.timer = setTimeout(() => {
                decorateBadges(document);
                setupTables();
                setupTooltips();
                syncUserFooter();
            }, 80);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        document.body.classList.add("page-ready");
        setupThemeToggle();
        setupBackTop();
        setupBreadcrumb();
        markActiveMenu();
        syncUserFooter();
        setupLastUpdate();
        decorateBadges(document);
        setupTables();
        setupKeyboardShortcuts();
        setupInputHistory();
        setupTooltips();
        observeDynamicContent();
    }

    window.SupportDeskUI = {
        normalizar,
        escapeHtml,
        toast,
        copyText,
        syncUserFooter,
        decorateBadges,
        exportTableCsv
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
