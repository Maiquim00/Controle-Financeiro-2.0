import { supabase, supabaseConfigurado, supabaseConfigError } from "./supabase-client.js";

const views = [...document.querySelectorAll("[data-view]")];
const titulo = document.querySelector("#auth-titulo");
const descricao = document.querySelector("#auth-descricao");
const mensagem = document.querySelector("#auth-mensagem");
const textos = {
    login: ["Entre na sua conta", "Informe seus dados para continuar."],
    signup: ["Crie sua conta", "Preencha os dados para começar."],
    recovery: ["Recupere sua senha", "Enviaremos um link para o e-mail informado."],
    reset: ["Escolha uma nova senha", "Use pelo menos 8 caracteres."]
};

function mostrarMensagem(texto, tipo = "erro") {
    mensagem.textContent = texto;
    mensagem.className = `auth-message ${tipo}`;
    mensagem.hidden = !texto;
}

function mudarModo(modo, atualizarUrl = true) {
    const selecionado = textos[modo] ? modo : "login";
    for (const view of views) view.hidden = view.dataset.view !== selecionado;
    titulo.textContent = textos[selecionado][0];
    descricao.textContent = textos[selecionado][1];
    mostrarMensagem("");

    if (atualizarUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set("mode", selecionado);
        window.history.replaceState(null, "", url);
    }

    const primeiroCampo = document.querySelector(`[data-view="${selecionado}"] input`);
    primeiroCampo?.focus({ preventScroll: true });
}

function erroEmPortugues(error) {
    const texto = String(error?.message || "").toLowerCase();
    if (texto.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
    if (texto.includes("email not confirmed")) return "Confirme seu e-mail pelo link enviado antes de entrar.";
    if (texto.includes("already registered") || texto.includes("already been registered")) return "Este e-mail já possui uma conta. Tente entrar.";
    if (texto.includes("password") && (texto.includes("weak") || texto.includes("least"))) return "A senha deve ter pelo menos 8 caracteres.";
    if (texto.includes("rate limit") || texto.includes("security purposes")) return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
    if (texto.includes("fetch") || texto.includes("network")) return "Não foi possível conectar. Verifique sua internet e a configuração do Supabase.";
    return "Não foi possível concluir a solicitação. Confira os dados e tente novamente.";
}

function exigirSupabase() {
    if (supabaseConfigurado) return true;
    mostrarMensagem(`${supabaseConfigError} Consulte SUPABASE-SETUP.md e configure supabase-config.js.`, "info");
    return false;
}

function definirEnvio(formulario, enviando, texto = "") {
    const botao = formulario.querySelector("button[type='submit']");
    if (!botao.dataset.textoOriginal) botao.dataset.textoOriginal = botao.textContent;
    botao.disabled = enviando;
    botao.textContent = enviando ? texto : botao.dataset.textoOriginal;
}

function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

for (const botao of document.querySelectorAll("[data-mode]")) {
    botao.addEventListener("click", () => mudarModo(botao.dataset.mode));
}

for (const botao of document.querySelectorAll("[data-password-toggle]")) {
    botao.addEventListener("click", () => {
        const campo = document.getElementById(botao.dataset.passwordToggle);
        const mostrar = campo.type === "password";
        campo.type = mostrar ? "text" : "password";
        botao.textContent = mostrar ? "Ocultar" : "Mostrar";
        botao.setAttribute("aria-label", `${mostrar ? "Ocultar" : "Mostrar"} senha`);
    });
}

document.querySelector("#form-login").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const email = formulario.elements.email.value.trim();
    const senha = formulario.elements.password.value;
    if (!emailValido(email)) return mostrarMensagem("Informe um e-mail válido.");
    if (senha.length < 8) return mostrarMensagem("A senha deve ter pelo menos 8 caracteres.");
    if (!exigirSupabase()) return;

    definirEnvio(formulario, true, "Entrando...");
    let resultado;
    try {
        resultado = await supabase.auth.signInWithPassword({ email, password: senha });
    } catch (error) {
        resultado = { error };
    } finally {
        definirEnvio(formulario, false);
    }
    const { error } = resultado;
    if (error) return mostrarMensagem(erroEmPortugues(error));
    window.location.replace("index.html");
});

document.querySelector("#form-cadastro").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const nome = formulario.elements.name.value.trim();
    const email = formulario.elements.email.value.trim();
    const senha = formulario.elements.password.value;
    const confirmacao = formulario.elements["password-confirmation"].value;
    if (nome.length < 2) return mostrarMensagem("Informe seu nome com pelo menos 2 caracteres.");
    if (!emailValido(email)) return mostrarMensagem("Informe um e-mail válido.");
    if (senha.length < 8) return mostrarMensagem("A senha deve ter pelo menos 8 caracteres.");
    if (senha !== confirmacao) return mostrarMensagem("As senhas não conferem.");
    if (!exigirSupabase()) return;

    definirEnvio(formulario, true, "Criando conta...");
    let resultado;
    try {
        resultado = await supabase.auth.signUp({
            email,
            password: senha,
            options: {
                data: { full_name: nome },
                emailRedirectTo: new URL("index.html", window.location.href).href
            }
        });
    } catch (error) {
        resultado = { error };
    } finally {
        definirEnvio(formulario, false);
    }
    const { data, error } = resultado;
    if (error) return mostrarMensagem(erroEmPortugues(error));
    if (data.session) return window.location.replace("index.html");

    mudarModo("login");
    mostrarMensagem("Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.", "sucesso");
});

document.querySelector("#form-recuperacao").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const email = formulario.elements.email.value.trim();
    if (!emailValido(email)) return mostrarMensagem("Informe um e-mail válido.");
    if (!exigirSupabase()) return;

    definirEnvio(formulario, true, "Enviando...");
    let resultado;
    try {
        resultado = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: new URL("auth.html?mode=reset", window.location.href).href
        });
    } catch (error) {
        resultado = { error };
    } finally {
        definirEnvio(formulario, false);
    }
    const { error } = resultado;
    if (error) return mostrarMensagem(erroEmPortugues(error));
    mostrarMensagem("Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha.", "sucesso");
});

document.querySelector("#form-nova-senha").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const senha = formulario.elements.password.value;
    const confirmacao = formulario.elements["password-confirmation"].value;
    if (senha.length < 8) return mostrarMensagem("A senha deve ter pelo menos 8 caracteres.");
    if (senha !== confirmacao) return mostrarMensagem("As senhas não conferem.");
    if (!exigirSupabase()) return;

    definirEnvio(formulario, true, "Salvando...");
    let resultado;
    try {
        resultado = await supabase.auth.updateUser({ password: senha });
    } catch (error) {
        resultado = { error };
    } finally {
        definirEnvio(formulario, false);
    }
    const { error } = resultado;
    if (error) return mostrarMensagem(erroEmPortugues(error));
    window.location.replace("index.html");
});

const parametros = new URLSearchParams(window.location.search);
const tipoCallback = new URLSearchParams(window.location.hash.slice(1)).get("type");
mudarModo(parametros.get("mode") || (tipoCallback === "recovery" ? "reset" : "login"), false);

if (parametros.get("config") === "missing" || !supabaseConfigurado) {
    mostrarMensagem(`${supabaseConfigError} Consulte SUPABASE-SETUP.md antes de usar a autenticação.`, "info");
}

if (supabaseConfigurado) {
    supabase.auth.onAuthStateChange((evento) => {
        if (evento === "PASSWORD_RECOVERY") mudarModo("reset");
        if (evento === "SIGNED_OUT") window.location.replace("auth.html");
    });

    const modoAtual = parametros.get("mode");
    supabase.auth.getSession().then(({ data, error }) => {
        if (error) return mostrarMensagem("Não foi possível verificar sua sessão. Recarregue a página.");
        if (data.session && modoAtual !== "reset" && tipoCallback !== "recovery") {
            window.location.replace("index.html");
        }
    });
}