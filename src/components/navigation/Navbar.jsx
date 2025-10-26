// src/components/navigation/Navbar.jsx
import { useTranslation } from "react-i18next";
import BrandMark from "./BrandMark.jsx";
import LanguageSwitcher from "../common/LanguageSwitcher.jsx";
import DarkModeToggle from "./DarkModeToggle.jsx";

export default function Navbar({
  onLogin,                    // callback opcional externo
  showLogin = true,           // mostrar/ocultar botón login
  containerClass = "max-w-7xl"
}) {
  const { t } = useTranslation();

  const goHome = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goLogin = () => {
    if (onLogin) return onLogin();
    window.location.href = "/auth/login";
  };

  const scrollToId = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const links = [
    { id: "services", label: t("nav.services", "Servicios") },
    { id: "why-us", label: t("nav.benefits", "Beneficios") },
    { id: "testimonials", label: t("nav.testimonials", "Testimonios") },
    // si quieres también FAQ, descomenta:
    // { id: "faq", label: t("nav.faq", "Preguntas") },
  ];

  return (
    <header
      className="
        sticky top-0 z-40 border-b 
        bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60
        dark:bg-neutral-900/80 dark:supports-[backdrop-filter]:bg-neutral-900/60
        border-gray-200/70 dark:border-neutral-800
      "
    >
      <nav
        aria-label="Primary"
        className={`mx-auto ${containerClass} h-16 px-6 md:px-8 flex items-center justify-between gap-4`}
      >
        {/* Marca */}
        <div className="min-w-0">
          <BrandMark onClick={goHome} />
        </div>

        {/* Links al centro (solo md+) */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={scrollToId(link.id)}
                className="
                  inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium
                  text-[var(--text-1)]/85 hover:text-[var(--text-1)]
                  hover:bg-black/[0.04] dark:hover:bg-white/[0.08]
                  transition
                "
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Acciones a la derecha */}
        <div className="flex items-center gap-2 sm:gap-3">
          {showLogin && (
            <button
              onClick={goLogin}
              className="
                hidden sm:inline-flex h-9 items-center rounded-full border px-3.5 
                text-sm font-medium
                text-gray-800 hover:bg-black/5
                dark:text-gray-100 dark:hover:bg-white/10
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
                transition
              "
              aria-label={t("common.login")}
            >
              {t("common.login")}
            </button>
          )}
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </nav>
    </header>
  );
}
