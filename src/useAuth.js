import { useEffect, useState } from "react";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { callbackUrl, supabase } from "./supabase.js";

export default function useAuth(onCallbackComplete) {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [authLoading, setAuthLoading] = useState(
    () => !!supabase && window.location.pathname === "/auth/callback",
  );
  const [authRestoring, setAuthRestoring] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(
      ({ data, error }) => {
        if (!mounted) return;
        setUser(data?.session?.user || null);
        setAuthRestoring(false);
        if (error) {
          setAuthMsg(
            "Could not restore your login. Check your connection and try again.",
          );
          setAuthOpen(true);
        }
      },
      () => {
        if (mounted) {
          setAuthRestoring(false);
          setAuthMsg(
            "Could not connect to login. Typing still works on this device.",
          );
          setAuthOpen(true);
        }
      },
    );
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
        setAuthRestoring(false);
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authLoading || !supabase) return;
    let mounted = true;
    const complete = (message) => {
      if (!mounted) return;
      window.history.replaceState({}, "", "/");
      onCallbackComplete();
      setAuthLoading(false);
      if (message) {
        setAuthMsg(message);
        setAuthOpen(true);
      }
    };
    const failureMessage = (error) =>
      isAuthRetryableFetchError(error)
        ? "Login could not connect. Check your connection and try again."
        : "Login was cancelled or the link expired. Try again.";
    // Supabase consumes callback credentials during initialization, once per client.
    supabase.auth
      .initialize()
      .then(async ({ error }) => {
        if (error) {
          complete(failureMessage(error));
          return;
        }
        const { data, error: sessionError } = await supabase.auth.getSession();
        complete(
          sessionError
            ? failureMessage(sessionError)
            : !data?.session
              ? "Login link expired. Request a new link."
              : "",
        );
      })
      .catch(() =>
        complete("Login failed. Check your connection and try again."),
      );
    return () => {
      mounted = false;
    };
  }, [authLoading, onCallbackComplete]);

  async function login(kind) {
    if (!supabase || authPending) return;
    setAuthPending(true);
    setAuthMsg("");
    try {
      const { error } =
        kind === "google"
          ? await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: callbackUrl() },
            })
          : await supabase.auth.signInWithOtp({
              email: email.trim(),
              options: { emailRedirectTo: callbackUrl() },
            });
      setAuthMsg(
        error
          ? `Login failed: ${error.message}`
          : kind === "email"
            ? "Check your inbox for the login link."
            : "Opening Google login...",
      );
    } catch {
      setAuthMsg(
        "Login could not connect. Check your connection and try again.",
      );
    } finally {
      setAuthPending(false);
    }
  }

  return {
    user,
    setUser,
    authOpen,
    setAuthOpen,
    email,
    setEmail,
    authMsg,
    setAuthMsg,
    authPending,
    authLoading,
    authRestoring,
    login,
  };
}
