import { accountLinks } from "./accountLinks.js";
import { useEffect, useRef, useState } from "react";

export default function MobileNavigation({
  page,
  route,
  user,
  profile,
  loginAvailable,
  onNavigate,
  onLogin,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [route, user?.id]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    function resize() {
      if (!desktop.matches) return;
      if (
        container.current?.contains(document.activeElement) ||
        (open && document.activeElement === document.body)
      )
        document.querySelector(".wordmark")?.focus();
      setOpen(false);
    }
    desktop.addEventListener("change", resize);
    return () => desktop.removeEventListener("change", resize);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  function select(action) {
    setOpen(false);
    trigger.current?.focus();
    action();
  }

  return (
    <div
      className="mobile-navigation"
      ref={container}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="mobile-menu-toggle"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          {open ? (
            <>
              <path d="m18 6-12 12" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h16" />
            </>
          )}
        </svg>
      </button>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav-panel"
          aria-label="Mobile navigation"
        >
          <button
            aria-current={page === "type" ? "page" : undefined}
            onClick={() => select(() => onNavigate("type"))}
          >
            Type
          </button>
          {user ? (
            <>
              {accountLinks(profile).map(({ label, path }) => (
                <button
                  key={path}
                  aria-current={
                    page === "owner" && route === path ? "page" : undefined
                  }
                  onClick={() => select(() => onNavigate(path))}
                >
                  {label}
                </button>
              ))}
              <button onClick={() => select(onLogout)}>Log out</button>
            </>
          ) : (
            <>
              <button
                aria-current={page === "stats" ? "page" : undefined}
                onClick={() => select(() => onNavigate("stats"))}
              >
                Stats
              </button>
              {loginAvailable && (
                <button onClick={() => select(onLogin)}>Log in</button>
              )}
            </>
          )}
        </nav>
      )}
    </div>
  );
}
