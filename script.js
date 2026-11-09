import { supabase, supabaseConfigurado } from "./supabase-client.js";

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
const mensagem = document.querySelector("#mensagem-app");
const botaoSair = document.querySelector("#botao-sair");
const formatoMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});
const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

let transacoes = [];
let usuario = null;

function mostrarMensagem(texto, tipo = "erro") {
    mensagem.textContent = texto;
    mensagem.className = `mensagem-app ${tipo}`;
    mensagem.hidden = !texto;
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

    for (const transacao of transacoes) {
        const categoria = categorias[transacao.categoria] || categorias.outros;
        const item = criarElemento("article", "item-transacao");
        const detalhes = criarElemento("div", "detalhes-transacao");
        const icone = criarElemento("span", "icone-categoria", categoria.icone);
        icone.setAttribute("aria-hidden", "true");

        const texto = criarElemento("div", "texto-transacao");
        texto.append(
            criarElemento("p", "descricao-transacao", transacao.descricao),
            criarElemento("p", "meta-transacao", `${categoria.nome} · ${formatoData.format(new Date(transacao.created_at))}`)
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

async function carregarTransacoes() {
    const { data, error } = await supabase
        .from("transacoes")
        .select("id, descricao, valor, tipo, categoria, created_at")
        .eq("user_id", usuario.id)
        .order("created_at", { ascending: false });

    if (error) {
        mostrarMensagem("Não foi possível carregar suas transações. Confira a configuração do Supabase e as políticas RLS.");
        return;
    }

    transacoes = data.map((item) => ({ ...item, valor: Number(item.valor) }));
    mostrarMensagem("");
    renderizarTransacoes();
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const descricao = document.querySelector("#descricao").value.trim();
    const valor = Number(document.querySelector("#valor").value);
    const tipo = document.querySelector("#tipo").value;
    const categoria = document.querySelector("#categoria").value;

    if (!descricao || !Number.isFinite(valor) || valor <= 0 || !categorias[categoria]) return;

    const botao = formulario.querySelector("button[type='submit']");
    botao.disabled = true;
    mostrarMensagem("");

    const { data, error } = await supabase
        .from("transacoes")
        .insert({
        descricao,
        valor: Math.round(valor * 100) / 100,
        tipo,
        categoria,
        user_id: usuario.id
        })
        .select("id, descricao, valor, tipo, categoria, created_at")
        .single();

    botao.disabled = false;
    if (error) {
        mostrarMensagem("Não foi possível salvar a transação. Verifique a tabela e as políticas de acesso do Supabase.");
        return;
    }

    transacoes.unshift({ ...data, valor: Number(data.valor) });
    renderizarTransacoes();
    formulario.reset();
    document.querySelector("#descricao").focus();
});

lista.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("button[data-id]");
    if (!botao) return;

    botao.disabled = true;
    const { error } = await supabase
        .from("transacoes")
        .delete()
        .eq("id", botao.dataset.id)
        .eq("user_id", usuario.id);

    if (error) {
        botao.disabled = false;
        mostrarMensagem("Não foi possível remover a transação.");
        return;
    }

    transacoes = transacoes.filter((item) => item.id !== botao.dataset.id);
    renderizarTransacoes();
});

botaoSair.addEventListener("click", async () => {
    botaoSair.disabled = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
        botaoSair.disabled = false;
        mostrarMensagem("Não foi possível encerrar a sessão. Tente novamente.");
        return;
    }
    window.location.replace("auth.html");
});

async function iniciarDashboard() {
    if (!supabaseConfigurado) {
        window.location.replace("auth.html?config=missing");
        return;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
        window.location.replace("auth.html");
        return;
    }

    usuario = data.session.user;
    document.querySelector("#usuario-email").textContent = usuario.email || "Conta conectada";
    await carregarTransacoes();
}

iniciarDashboard();
