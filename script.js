const STORAGE_KEY = "controle-financeiro-transacoes";
const categorias = {
    alimentacao: { nome: "Alimentação", icone: "🍽️" },
    transporte: { nome: "Transporte", icone: "🚗" },
    casa: { nome: "Casa", icone: "🏠" },
    lazer: { nome: "Lazer", icone: "🎬" },
    estudos: { nome: "Estudos", icone: "📚" },
    tecnologia: { nome: "Tecnologia", icone: "💻" },
    outros: { nome: "Outros", icone: "📌" }
};

const formulario = document.querySelector("#form-transacao");
const lista = document.querySelector("#lista-transacoes");
const formatoMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});
const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function carregarTransacoes() {
    try {
        const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(dados) ? dados.filter((item) =>
            item && typeof item.id === "string" &&
            typeof item.descricao === "string" &&
            Number.isFinite(item.valor) && item.valor > 0 &&
            (item.tipo === "receita" || item.tipo === "despesa")
        ) : [];
    } catch {
        return [];
    }
}

let transacoes = carregarTransacoes();

function salvarTransacoes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transacoes));
    } catch {
        // A tela continua funcionando mesmo se o navegador bloquear o armazenamento.
    }
}

function atualizarResumo() {
    const receitas = transacoes
        .filter((item) => item.tipo === "receita")
        .reduce((total, item) => total + item.valor, 0);
    const despesas = transacoes
        .filter((item) => item.tipo === "despesa")
        .reduce((total, item) => total + item.valor, 0);

    document.querySelector("#receitas").textContent = formatoMoeda.format(receitas);
    document.querySelector("#despesas").textContent = formatoMoeda.format(despesas);
    document.querySelector("#saldo").textContent = formatoMoeda.format(receitas - despesas);
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function renderizarTransacoes() {
    lista.replaceChildren();

    if (transacoes.length === 0) {
        lista.append(criarElemento("p", "vazio", "Nenhuma transação cadastrada."));
        atualizarResumo();
        return;
    }

    const recentes = [...transacoes].sort((a, b) => b.criadaEm - a.criadaEm);
    for (const transacao of recentes) {
        const categoria = categorias[transacao.categoria] || categorias.outros;
        const item = criarElemento("article", "item-transacao");
        const detalhes = criarElemento("div", "detalhes-transacao");
        const icone = criarElemento("span", "icone-categoria", categoria.icone);
        icone.setAttribute("aria-hidden", "true");

        const texto = criarElemento("div", "texto-transacao");
        texto.append(
            criarElemento("p", "descricao-transacao", transacao.descricao),
            criarElemento("p", "meta-transacao", `${categoria.nome} · ${formatoData.format(new Date(transacao.criadaEm))}`)
        );
        detalhes.append(icone, texto);

        const lado = criarElemento("div", "lado-transacao");
        const sinal = transacao.tipo === "receita" ? "+" : "−";
        lado.append(criarElemento(
            "p",
            `valor-transacao ${transacao.tipo}`,
            `${sinal} ${formatoMoeda.format(transacao.valor)}`
        ));

        const remover = criarElemento("button", "botao-remover", "×");
        remover.type = "button";
        remover.dataset.id = transacao.id;
        remover.setAttribute("aria-label", `Remover transação: ${transacao.descricao}`);
        lado.append(remover);

        item.append(detalhes, lado);
        lista.append(item);
    }

    atualizarResumo();
}

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const descricao = document.querySelector("#descricao").value.trim();
    const valor = Number(document.querySelector("#valor").value);
    const tipo = document.querySelector("#tipo").value;
    const categoria = document.querySelector("#categoria").value;

    if (!descricao || !Number.isFinite(valor) || valor <= 0 || !categorias[categoria]) return;

    transacoes.push({
        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        descricao,
        valor: Math.round(valor * 100) / 100,
        tipo,
        categoria,
        criadaEm: Date.now()
    });

    salvarTransacoes();
    renderizarTransacoes();
    formulario.reset();
    document.querySelector("#descricao").focus();
});

lista.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-id]");
    if (!botao) return;

    transacoes = transacoes.filter((item) => item.id !== botao.dataset.id);
    salvarTransacoes();
    renderizarTransacoes();
});

renderizarTransacoes();
