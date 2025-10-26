// src/layout/SiteFooter.jsx

import React, { useMemo } from "react";
import FooterWaves from "./FooterWaves";
import { useTranslation } from "react-i18next";

/* ===== estilos base ===== */
const S = {
  wrap: "container-narrow px-6 md:px-8 py-12 md:py-14",
  grid: "grid gap-8 sm:grid-cols-2 lg:grid-cols-4",
  col: "space-y-4 text-sm",
  head: "text-base font-semibold text-[var(--text-1)]",
  item: "block text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors duration-300",
  socialBtn:
    "block h-5 w-5 rounded-full bg-[var(--text-2)]/40 transition hover:bg-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
};

/* Columna generada semánticamente con <nav> + <ul> */
function FooterColumn({ title, links, ariaLabel }) {
  return (
    <nav aria-label={ariaLabel ?? title} className={S.col}>
      <p className={S.head}>{title}</p>
      <ul className="space-y-3">
        {links.map(({ href, label }) => (
          <li key={href}>
            <a href={href} className={S.item}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function SiteFooter() {
  const { t } = useTranslation();

  /* Estructura de links memoizada (evita recalcular en cada render) */
  const columns = useMemo(
    () => ({
      solutions: {
        title: t("footer.solutions", "Soluciones"),
        links: [
          { href: "#services", label: t("nav.services", "Servicios") },
          { href: "#why-us", label: t("nav.whyUs", "¿Por qué elegirnos?") },
          { href: "#profile", label: t("nav.profile", "Profesionales") },
          { href: "#faq", label: "FAQ" },
        ],
      },
      support: {
        title: t("footer.support", "Soporte"),
        links: [
          { href: "#", label: t("footer.docs", "Documentación") },
          { href: "#", label: t("footer.guides", "Guías") },
          { href: "#", label: t("footer.status", "Estado") },
        ],
      },
      company: {
        title: t("footer.company", "Compañía"),
        links: [
          { href: "#", label: t("footer.aboutUs", "Nosotros") },
          { href: "#", label: t("footer.blog", "Blog") },
          { href: "#", label: t("footer.jobs", "Empleos") },
          { href: "#", label: t("footer.press", "Prensa") },
        ],
      },
    }),
    [t]
  );

  return (
    <footer
      role="contentinfo"
      className="
        relative overflow-hidden
        bg-[var(--surface-footer)] text-[var(--text-1)] with-hairline
      "
    >
      {/* Fondo animado (olas) */}
      <FooterWaves />

      {/* Contenido */}
      <div className={`relative z-10 ${S.wrap}`}>
        <div className={S.grid}>
          {/* Columna de marca */}
          <div className={S.col}>
            <p className={S.head}>NutriSalud</p>
            <p className="text-[var(--text-2)]">
              {t(
                "footer.about",
                "Haciendo del mundo un lugar más saludable mediante hábitos simples y sostenibles."
              )}
            </p>

            <div className="mt-4 flex items-center gap-4">
              {["facebook", "instagram", "twitter", "github"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={`Visita nuestro ${social}`}
                  className={S.socialBtn}
                />
              ))}
            </div>
          </div>

          {/* Columnas de navegación */}
          <FooterColumn
            {...columns.solutions}
            ariaLabel={t("footer.solutions", "Soluciones")}
          />
          <FooterColumn
            {...columns.support}
            ariaLabel={t("footer.support", "Soporte")}
          />
          <FooterColumn
            {...columns.company}
            ariaLabel={t("footer.company", "Compañía")}
          />
        </div>
      </div>

      {/* Copyright mínimo */}
      <div className="relative z-10 text-center pb-4">
        <small className="text-[10px] md:text-xs text-[var(--text-2)]">
          © {new Date().getFullYear()}{" "}
          <a
            href="/devs"
            className="font-semibold hover:underline text-[var(--text-1)]"
            rel="noopener"
          >
            DeltaDevs
          </a>
          . {t("footer.rights", "Todos los derechos reservados.")}
        </small>
      </div>
    </footer>
  );
}
