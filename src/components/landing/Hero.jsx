// src/components/landing/Hero.jsx
import { useTranslation } from "react-i18next";
import { BRAND } from "../../lib/brand";

export default function Hero() {
  const { t } = useTranslation();

  const goLogin = () => (window.location.href = "/login");
  const goWhatsApp = () =>
    window.dispatchEvent(new CustomEvent("open-whatsapp"));

  return (
    <section
      className="
        relative mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-24 text-center
        bg-gradient-to-b from-[var(--brand-50)]/70 to-[var(--surface-0)]
        dark:from-[var(--brand-600)]/10 dark:to-[var(--surface-1)]
        rounded-none md:rounded-[28px]
      "
      aria-labelledby="hero-title"
    >
      {/* Glow de fondo (suave, no bloquea interacciones) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="
          absolute left-1/2 top-6 h-64 w-[38rem] -translate-x-1/2
          rounded-[56px] bg-[var(--brand-100)]/35 blur-3xl
          dark:bg-[var(--brand-600)]/15
          motion-safe:transition-opacity
        " />
      </div>

      {/* Título */}
      <h1
        id="hero-title"
        className="
          mt-2 text-4xl md:text-6xl font-extrabold leading-tight tracking-tight
          text-[var(--text-1)]
        "
      >
        {t("hero.title", { brand: BRAND?.name ?? "NutriSalud" })}
      </h1>

      {/* Lead */}
      <p className="mt-4 md:mt-6 text-base md:text-lg text-[var(--text-2)]">
        {t("hero.lead")}
      </p>

      {/* CTAs */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={goLogin}
          className="
            inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold
            text-white bg-[var(--brand-600)]
            shadow-[0_6px_22px_color-mix(in_oklab,var(--brand-600)_30%,transparent)]
            hover:brightness-[1.05]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]
            focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]
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
            bg-[var(--surface-0)] text-[var(--text-1)]
            hover:bg-[var(--brand-50)]/70 dark:hover:bg-[var(--brand-600)]/10
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]
            focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]
            motion-safe:transition
          "
          aria-label={t("common.contact", "Contactar")}
        >
          {t("common.contact", "Contactar")}
        </button>
      </div>
    </section>
  );
}
