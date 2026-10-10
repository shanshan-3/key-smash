import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function storageAvailable() {
  try {
    const key = `keysmash-auth-check-${Math.random()}`;
    globalThis.localStorage.setItem(key, key);
    globalThis.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const loginStorageAvailable =
  !!supabaseUrl && !!supabaseKey && storageAvailable();

const codeCallback =
  globalThis.location?.pathname === "/auth/callback" &&
  new URLSearchParams(globalThis.location.search).has("code");

// Match incoming code callbacks so the SDK can exchange them during initialization.
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { flowType: codeCallback ? "pkce" : "implicit" },
      })
    : null;

export const callbackUrl = () => `${window.location.origin}/auth/callback`;
