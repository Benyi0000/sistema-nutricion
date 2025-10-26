// src/components/landing/ServicesSection.jsx
import { useTranslation } from "react-i18next";

/* Fallbacks SVG si no hay imagen */
function IconAssessment(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  );
}
function IconPlan(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
function IconFollowUp(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 3v6h6" />
    </svg>
  );
}
const ICONS = [IconAssessment, IconPlan, IconFollowUp];

export default function ServicesSection() {
  const { t } = useTranslation();
  const items = t("services.items", { returnObjects: true });

  return (
    <section className="py-14 md:py-20">
      <h2
        id="services-title"
        className="text-center text-2xl md:text-3xl font-bold text-[var(--text-1)]"
      >
        {t("services.title")}
      </h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => {
          const Icon = ICONS[idx] ?? ICONS[0];

          return (
            <article
              key={idx}
              className="
                group relative overflow-hidden h-full
                rounded-2xl border border-[var(--border-1)]
                bg-[var(--surface-0)] dark:bg-[var(--surface-2)]
                shadow-[0_1px_1px_rgba(17,17,26,0.05)]
                hover:shadow-[0_10px_24px_rgba(17,17,26,0.08)]
                transition
              "
            >
              {/* aura hover igual */}
              <div
                aria-hidden="true"
                className="
                  absolute inset-0 -z-10
                  bg-[radial-gradient(600px_200px_at_50%_-20%,var(--brand-100),transparent)]
                  opacity-0 group-hover:opacity-100 transition-opacity
                  dark:bg-[radial-gradient(600px_200px_at_50%_-20%,var(--brand-600),transparent)]
                "
              />

              {/* ⬇️ Ajustes aquí */}
              <div className="p-5 md:p-6 md:flex md:items-center md:gap-5 md:min-h-[150px]">
                {/* media box */}
                <div
                  className="
                    shrink-0 grid place-items-center
                    h-24 w-24 md:h-28 md:w-28
                    rounded-xl
                    bg-[var(--brand-50)]/60 text-[var(--brand-600)]
                    dark:bg-[var(--brand-600)]/15 dark:text-[var(--brand-500)]
                    ring-1 ring-[var(--border-1)]
                    transition group-hover:scale-[1.02]
                  "
                >
                  {item?.img ? (
                    <img
                      src={item.img}
                      alt={item.title}
                      className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.06]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Icon className="h-7 w-7" />
                  )}
                </div>

                {/* texto */}
                <div className="mt-4 md:mt-0 md:flex-1 min-w-0">
                  <h3
                    className="
                      font-semibold text-[16px] sm:text-lg leading-snug
                      text-[var(--text-1)]
                      whitespace-normal break-words hyphens-auto
                    "
                  >
                    {item.title}
                  </h3>

                  <p
                    className="
                      mt-1.5 text-sm leading-relaxed text-[var(--text-2)]
                      break-words hyphens-auto
                    "
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
