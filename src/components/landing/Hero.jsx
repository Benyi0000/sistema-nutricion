// src/components/landing/Hero.jsx
import { useTranslation } from "react-i18next";
import { BRAND } from "../../lib/brand";

export default function Hero() {
  const { t } = useTranslation();

  const goLogin = () => (window.location.href = "/login");
  const goWhatsApp = () => window.dispatchEvent(new CustomEvent("open-whatsapp"));

  return (
    <section
      aria-labelledby="hero-title"
      className="
        relative
        hero-wallpaper hero-band hero-overlap   /* <- full-bleed + bajo el nav */
        w-full mx-auto px-0
        py-14 md:py-20
      "
    >
      {/* Velo sutil para contraste sobre el patrón */}
      <div
        aria-hidden="true"
        className="
          absolute inset-0 -z-[1]
          bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.04))]
          dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.30),transparent)]
        "
      />

      {/* Contenido centrado. Le damos z-index para que quede por delante del ::before */}
      <div className="container-narrow px-6 md:px-8 text-center relative z-10">
        <h1
          id="hero-title"
          className="
            mt-2 text-4xl md:text-6xl font-extrabold leading-tight tracking-tight
            text-[var(--text-1)]
          "
        >
          {t("hero.title", { brand: BRAND?.name ?? "NutriSalud" })}
        </h1>

        <p className="mt-4 md:mt-6 text-base md:text-lg text-[var(--text-2)]">
          {t("hero.lead")}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={goLogin}
            className="
              inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold
              text-white bg-[var(--brand-600)]
              shadow-[0_6px_22px_color-mix(in_oklab,var(--brand-600)_30%,transparent)]
              hover:brightness-[1.05]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]
              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
              motion-safe:transition
            "
            aria-label={t("common.login", "Login")}
          >
            {t("common.login", "Login")}
          </button>

          <button
            onClick={goWhatsApp}
            className="
              inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold
              border border-[var(--border-1)]
              bg-[color-mix(in_srgb,var(--surface-0)_85%,transparent)]
              text-[var(--text-1)]
              hover:bg-[var(--brand-50)]/70 dark:hover:bg-[var(--brand-600)]/10
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]
              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
              motion-safe:transition
            "
            aria-label={t("common.contact", "Contactar")}
          >
            {t("common.contact", "Contactar")}
          </button>
        </div>
      </div>
    </section>
  );
}
