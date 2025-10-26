// src/components/navigation/DarkModeToggle.jsx
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    // sincroniza con cambios externos (p. ej. otra pestaña)
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const ls = localStorage.getItem("theme");
      if (!ls) {
        const systemDark = mq.matches;
        document.documentElement.classList.toggle("dark", systemDark);
        setIsDark(systemDark);
      }
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      title={isDark ? "Tema oscuro" : "Tema claro"}
      className="
        inline-flex h-9 w-9 items-center justify-center rounded-full border
        bg-white/70 hover:bg-black/5
        dark:bg-neutral-900/70 dark:hover:bg-white/10
        border-gray-200/80 dark:border-neutral-700
        transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
      "
    >
      {/* Un único SVG negro que en dark se invierte a blanco */}
      <img
        src="/brand/logo-dark.svg"
        alt=""
        className="h-5 w-5 select-none pointer-events-none dark:invert"
      />
    </button>
  );
}
