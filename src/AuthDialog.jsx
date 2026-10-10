import { useEffect, useRef } from "react";
import { loginStorageAvailable } from "./supabase.js";

export default function AuthDialog({
  authOpen,
  setAuthOpen,
  email,
  setEmail,
  authMsg,
  authPending,
  login,
}) {
  const dialogRef = useRef(null);
  const authTriggerRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (authOpen && dialog && !dialog.open) {
      authTriggerRef.current = document.activeElement;
      dialog.showModal();
    } else if (!authOpen && dialog?.open) {
      dialog.close();
      authTriggerRef.current?.focus?.();
    }
  }, [authOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby="auth-heading"
      onCancel={() => setAuthOpen(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          const r = e.target.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            setAuthOpen(false);
        }
      }}
    >
      <div className="section-heading">
        <h2 id="auth-heading">Save your pace.</h2>
        <button className="text-button" onClick={() => setAuthOpen(false)}>
          Close
        </button>
      </div>
      <p>
        Log in for cloud history. Your tests always work without an account.
      </p>
      {!loginStorageAvailable && (
        <p role="status">
          This browser cannot remember your login. You can sign in for this
          visit.
        </p>
      )}
      <button
        className="brutal-btn"
        disabled={authPending}
        onClick={() => login("google")}
      >
        Continue with Google
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login("email");
        }}
      >
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button className="brutal-btn primary" disabled={authPending}>
          {authPending ? "Connecting..." : "Send login link"}
        </button>
      </form>
      {authMsg && <p role="status">{authMsg}</p>}
    </dialog>
  );
}
