import { useLayoutEffect, useState } from "react";
import AccountMenu from "./AccountMenu.jsx";
import MobileNavigation from "./MobileNavigation.jsx";

export default function Masthead({
  page,
  route,
  user,
  profile,
  loginAvailable,
  onNavigate,
  onLogin,
  onLogout,
}) {
  const [header, setHeader] = useState(null);

  useLayoutEffect(() => {
    if (!header) return;
    const root = document.documentElement;
    const measure = () =>
      root.style.setProperty(
        "--masthead-height",
        `${header.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--masthead-height");
    };
  }, [header]);

  return (
    <header className="masthead" ref={setHeader}>
      <button
        className="wordmark"
        onClick={() => onNavigate("type")}
        aria-label="KEYSMASH home"
      >
        <img src="/favicon.png" alt="" width="40" height="40" />
        KEYSMASH<span aria-hidden="true">.</span>
      </button>
      <nav className="desktop-navigation" aria-label="Main navigation">
        <button
          aria-current={page === "type" ? "page" : undefined}
          onClick={() => onNavigate("type")}
        >
          Type
        </button>
        {user ? (
          <AccountMenu
            current={page === "owner"}
            route={route}
            profile={profile}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        ) : (
          <>
            <button
              aria-current={page === "stats" ? "page" : undefined}
              onClick={() => onNavigate("stats")}
            >
              Stats
            </button>
            {loginAvailable && <button onClick={onLogin}>Log in</button>}
          </>
        )}
      </nav>
      <MobileNavigation
        page={page}
        route={route}
        user={user}
        profile={profile}
        loginAvailable={loginAvailable}
        onNavigate={onNavigate}
        onLogin={onLogin}
        onLogout={onLogout}
      />
    </header>
  );
}
