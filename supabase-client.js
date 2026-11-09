import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

export const supabaseConfigurado =
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("SEU-PROJETO") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes("COLE_A_CHAVE");

export const supabase = supabaseConfigurado
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;