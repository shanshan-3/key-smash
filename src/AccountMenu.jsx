import { accountLinks } from "./accountLinks.js";
import { useEffect, useRef, useState } from "react";

export default function AccountMenu({
  current,
  route,
  profile,
  onNavigate,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [route]);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector("button")?.focus();
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

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function select(path) {
    setOpen(false);
    onNavigate(path);
  }
  function keys(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    const items = [...menu.current.querySelectorAll("button")];
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    if (event.key === "ArrowUp")
      next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      items[next].focus();
    }
  }

  return (
    <div className="account-menu" ref={container}>
      <button
        ref={trigger}
        aria-current={current ? "page" : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        Profile
      </button>
      {open && (
        <div
          id="account-menu"
          className="account-menu-items"
          role="menu"
          aria-label="Profile"
          ref={menu}
          onKeyDown={keys}
        >
          {accountLinks(profile).map(({ label, path }) => (
            <button key={path} role="menuitem" onClick={() => select(path)}>
              {label}
            </button>
          ))}
          <button
            role="menuitem"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
