// src/components/landing/NutritionistSection.jsx
import { useTranslation } from "react-i18next";

/**
 * Devuelve { lead, areas, afterLead }
 * - lead: primer párrafo no-bullet
 * - areas: [{title, text}] detectados por "Titulo: texto"
 * - afterLead: resto de párrafos no-bullet
 */
function parseBioMultilingual(bioRaw, i18nLang = "es") {
  const bio = (bioRaw ?? "").toString().trim();
  if (!bio) return { lead: "", areas: [], afterLead: [] };

  // 1) Partir en bloques por líneas en blanco
  const blocks = bio
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  // 2) Títulos “conocidos” por idioma (puedes ajustar/añadir sin romper nada)
  const STARTS = [
    // ES
    "Nutrición y Obesidad:",
    "Nutrición Deportiva:",
    "Nutrición Infantil y Educación Alimentaria:",
    // EN
    "Obesity and Weight Management:",
    "Sports Nutrition:",
    "Child Nutrition and Food Education:",
    // IT
    "Nutrizione e Gestione del Peso:",
    "Nutrizione Sportiva:",
    "Nutrizione Infantile ed Educazione Alimentare:",
    // PT-BR
    "Nutrição e Controle de Peso:",
    "Nutrição Esportiva:",
    "Nutrição Infantil e Educação Alimentar:",
  ];

  const areas = [];
  const nonBullets = [];

  for (const block of blocks) {
    // ¿Empieza con “Título: …”?
    const candidate = STARTS.find((k) => block.startsWith(k));
    if (candidate) {
      areas.push({
        title: candidate.replace(/:\s*$/, ""), // sin los " : "
        text: block.slice(candidate.length).trim(),
      });
      continue;
    }

    // Generic fallback: “Algo con mayúsculas y dos puntos al inicio”
    // Evita “Mi Compromiso: …” se convertirá en bullet válido (también sirve)
    if (/^[\p{Lu}A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÇ ]+:\s+/u.test(block)) {
      const [head, ...rest] = block.split(":");
      areas.push({
        title: head.trim(),
        text: rest.join(":").trim(),
      });
      continue;
    }

    nonBullets.push(block);
  }

  const lead = nonBullets[0] || "";
  const afterLead = nonBullets.slice(1);

  return { lead, areas, afterLead };
}

/** Divide un párrafo en {firstSentence, rest} para resaltar la primera frase. */
function splitFirstSentence(p = "") {
  const m = p.match(/^(.+?[.!?])\s+(.*)$/s);
  if (!m) return { first: p, rest: "" };
  return { first: m[1], rest: m[2] };
}

export default function NutritionistSection() {
  const { t, i18n } = useTranslation();

  // Objeto completo del perfil (si existe)
  const profile = t("profile", { returnObjects: true }) || {};
  const {
    title = "",
    name = "",
    degree = "",
    photo = "/brand/nutri-leila.png",
    tags = [],
    bio = "",
    highlights = [], // opcional en JSON
  } = profile;

  // Si hay highlights en el JSON, los usamos; si no, parseamos la bio
  let parsed = { lead: "", areas: [], afterLead: [] };
  if (Array.isArray(highlights) && highlights.length > 0) {
    parsed.areas = highlights
      .filter((h) => h && (h.title || h.text))
      .map((h) => ({ title: h.title || "", text: h.text || "" }));
    parsed.lead = bio ? bio.split(/\n\s*\n+/)[0] : "";
    parsed.afterLead = bio ? bio.split(/\n\s*\n+/).slice(1) : [];
  } else {
    parsed = parseBioMultilingual(bio, i18n.language);
  }

  const { lead, areas, afterLead } = parsed;
  const { first: leadBold, rest: leadRest } = splitFirstSentence(lead);

  const openWhats = () =>
    window.dispatchEvent(new CustomEvent("open-whatsapp"));

  return (
    <section className="py-14 md:py-20" id="profile" aria-labelledby="profile-title">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface-0)] dark:bg-[var(--surface-2)] shadow-[0_1px_1px_rgba(17,17,26,0.05)]">
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[320px,1fr] md:grid-cols-[260px,1fr]">
            {/* Foto + tags */}
            <aside className="flex flex-col items-center md:items-start">
              <div className="overflow-hidden rounded-2xl ring-1 ring-[var(--border-1)] shadow-sm">
                <img
                  src={photo}
                  alt={name || "Nutritionist"}
                  className="block h-72 w-72 md:h-[18rem] md:w-[18rem] object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {Array.isArray(tags) && tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="inline-flex items-center rounded-full bg-[var(--brand-50)]/70 px-3 py-1 text-xs font-medium text-[var(--brand-700)] ring-1 ring-[var(--border-1)] dark:bg-[var(--brand-600)]/10 dark:text-[var(--brand-200)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </aside>

            {/* Contenido */}
            <div className="min-w-0">
              {title && (
                <p
                  id="profile-title"
                  className="text-sm font-medium text-[var(--brand-700)] dark:text-[var(--brand-300)]"
                >
                  {title}
                </p>
              )}
              {name && (
                <h3 className="mt-1 text-2xl md:text-3xl font-bold text-[var(--text-1)]">
                  {name}
                </h3>
              )}
              {degree && (
                <p className="mt-1 text-[var(--text-2)]">{degree}</p>
              )}

              {/* Lead destacado */}
              {lead && (
                <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-1)] break-words">
                  <span className="font-semibold">{leadBold}</span>
                  {leadRest ? " " + leadRest : ""}
                </p>
              )}

              {/* Áreas (bullets con subtítulo) */}
              {areas.length > 0 && (
                <ul className="mt-6 space-y-4">
                  {areas.map((a, i) => (
                    <li
                      key={`${a.title}-${i}`}
                      className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-0)]/50 p-4 dark:bg-white/[0.03]"
                    >
                      <p className="text-[15px] leading-relaxed text-[var(--text-2)] break-words">
                        {a.title ? (
                          <>
                            <span className="font-semibold text-[var(--text-1)]">
                              {a.title}
                            </span>
                            {a.text ? ": " : ""}
                          </>
                        ) : null}
                        {a.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Párrafos finales */}
              {afterLead.length > 0 && (
                <div className="mt-6 space-y-4">
                  {afterLead.map((p, i) => (
                    <p
                      key={`p-${i}`}
                      className="text-[15px] leading-relaxed text-[var(--text-2)] break-words"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={openWhats}
                  className="inline-flex items-center rounded-full bg-[var(--brand-600)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]"
                >
                  {t("common.contact", "Contactar")}
                </button>
                <a
                  href="/login"
                  className="inline-flex items-center rounded-full border border-[var(--border-1)] bg-[var(--surface-0)] px-5 py-2.5 text-sm font-semibold text-[var(--text-1)] hover:bg-[var(--brand-50)] dark:hover:bg-[var(--brand-600)]/10"
                >
                  {t("common.login", "Login")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
