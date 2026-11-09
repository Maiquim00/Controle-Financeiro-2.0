import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import * as config from "./supabase-config.js";

const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_KEY = config.SUPABASE_PUBLISHABLE_KEY || config.SUPABASE_ANON_KEY;

function urlDoProjetoValida(valor) {
    if (typeof valor !== "string") return false;

    try {
        const url = new URL(valor);
        const host = url.hostname.toLowerCase();
        return url.protocol === "https:" &&
            !host.includes("seu-projeto") &&
            !host.includes("your-project");
    } catch {
        return false;
    }
}

function chavePublicaValida(valor) {
    if (typeof valor !== "string" || valor.startsWith("sb_secret_")) return false;
    if (valor.startsWith("sb_publishable_")) return valor.length > 24;

    const partes = valor.split(".");
    if (partes.length !== 3) return false;

    try {
        const payload = partes[1].replace(/-/g, "+").replace(/_/g, "/");
        const preenchido = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
        return JSON.parse(atob(preenchido)).role === "anon";
    } catch {
        return false;
    }
}

const urlValida = urlDoProjetoValida(SUPABASE_URL);
const chaveValida = chavePublicaValida(SUPABASE_KEY);

export const supabaseConfigError = !urlValida
    ? "A URL do projeto Supabase não foi preenchida corretamente."
    : !chaveValida
        ? "Informe uma chave publicável (sb_publishable_) ou anon legada; chaves secretas não podem ser usadas no navegador."
        : "";

export const supabaseConfigurado = !supabaseConfigError;

export const supabase = supabaseConfigurado
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;