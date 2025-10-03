// src/components/landing/WhyUsSection.jsx
import { useTranslation } from "react-i18next";

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" {...props}>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WhyUsSection() {
  const { t } = useTranslation();
  const bullets = t("why.bullets", { returnObjects: true });

  return (
    <section className="py-12 md:py-16">
      <h2
        id="whyus-title"
        className="text-center text-2xl md:text-3xl font-bold text-[var(--text-1)]"
      >
        {t("why.title")}
      </h2>

      <ul className="mt-8 space-y-4">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="
              group relative overflow-hidden
              rounded-2xl border border-[var(--border-1)]
              bg-[var(--surface-0)] dark:bg-[var(--surface-2)]
              shadow-[0_1px_1px_rgba(17,17,26,0.05)]
              hover:shadow-[0_10px_24px_rgba(17,17,26,0.08)]
              transition
            "
          >
            {/* glow sutil */}
            <div
              aria-hidden="true"
              className="
                absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity
                bg-[radial-gradient(500px_150px_at_25%_-20%,var(--brand-100),transparent)]
                dark:bg-[radial-gradient(500px_150px_at_25%_-20%,var(--brand-600),transparent)]
              "
            />

            <div className="flex items-center gap-3 p-4 md:p-5">
              {/* chip del check */}
              <span
                className="
                  inline-flex h-8 w-8 items-center justify-center shrink-0
                  rounded-full
                  bg-[var(--brand-50)]/70 text-[var(--brand-700)]
                  dark:bg-[var(--brand-600)]/15 dark:text-[var(--brand-300)]
                  ring-1 ring-[var(--border-1)]
                  transition group-hover:scale-[1.06]
                "
              >
                <CheckIcon />
              </span>

              <p className="text-[var(--text-1)]">{b}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
