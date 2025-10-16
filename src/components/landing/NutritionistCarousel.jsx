// src/components/landing/NutritionistCarousel.jsx
import { useEffect, useMemo, useRef, useState } from "react";

export default function NutritionistCarousel({
  items = [],
  onContactProfile,
  onLoginProfile,
  // opcionales
  auto = true,            // auto-advance ON
  interval = 6000,        // cada 6s
  hoverPause = true,      // pausa al hover/focus
}) {
  const data = useMemo(() => items.filter(Boolean), [items]);
  const [i, setI] = useState(0);
  const wrap = (n) => (n + data.length) % data.length;
  const timer = useRef(null);
  const paused = useRef(false);
  const startX = useRef(0);

  // ---- navegación teclado
  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") setI((v) => wrap(v + 1));
      if (e.key === "ArrowLeft") setI((v) => wrap(v - 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [data.length]);

  // ---- swipe
  const onDown = (e) =>
    (startX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0);
  const onUp = (e) => {
    const x = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const dx = x - startX.current;
    if (Math.abs(dx) > 40) {
      setI((v) => wrap(v + (dx < 0 ? 1 : -1)));
      restart(); // reinicia el ciclo
    }
  };

  // ---- auto-advance (respeta reduced motion y visibilidad)
  const prefersReduced = typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const clear = () => { if (timer.current) clearInterval(timer.current); };
  const restart = () => {
    clear();
    if (!auto || prefersReduced || paused.current || data.length <= 1) return;
    timer.current = setInterval(() => {
      setI((v) => wrap(v + 1));
    }, interval);
  };

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) clear(); else restart();
    };
    document.addEventListener("visibilitychange", onVis);
    restart();
    return () => { clear(); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, interval, prefersReduced, data.length]);

  // ---- hover/focus pause
  const onEnter = () => { if (!hoverPause) return; paused.current = true; clear(); };
  const onLeave = () => { if (!hoverPause) return; paused.current = false; restart(); };

  if (!data.length) return null;
  const cur = data[i];

  return (
    <div className="relative select-none" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div
        className="
          overflow-hidden rounded-[24px]
          ring-1 ring-[var(--border-1)]
          bg-[var(--surface-0)]/90 dark:bg-[var(--surface-2)]/80
          backdrop-blur supports-[backdrop-filter]:bg-[var(--surface-0)]/60
          shadow-[0_10px_30px_rgba(17,17,26,0.08)]
          relative
        "
        onPointerDown={onDown}
        onPointerUp={onUp}
        onTouchStart={onDown}
        onTouchEnd={onUp}
      >
        {/* Flechas flotantes */}
        {data.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => { setI((v) => wrap(v - 1)); restart(); }}
              className="
                absolute left-3 top-1/2 -translate-y-1/2 z-10
                h-10 w-10 rounded-full bg-[var(--surface-0)]/90
                ring-1 ring-[var(--border-1)]
                hover:bg-black/5 dark:hover:bg-white/10
                shadow-sm
              "
            >‹</button>

            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => { setI((v) => wrap(v + 1)); restart(); }}
              className="
                absolute right-3 top-1/2 -translate-y-1/2 z-10
                h-10 w-10 rounded-full bg-[var(--surface-0)]/90
                ring-1 ring-[var(--border-1)]
                hover:bg-black/5 dark:hover:bg-white/10
                shadow-sm
              "
            >›</button>
          </>
        )}

        {/* Card */}
        <article
          key={cur.id || cur.name || i}
          className="
            grid gap-8 p-6 md:p-8
            md:grid-cols-[280px,1fr] lg:grid-cols-[320px,1fr]
            items-start
          "
        >
          {/* Media */}
          <aside className="min-w-0">
            <figure className="overflow-hidden rounded-2xl ring-1 ring-[var(--border-1)] shadow-sm bg-[var(--surface-1)]">
              <div className="relative w-full aspect-[4/5]">
                <img
                  src={cur.photo}
                  alt={cur.name}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </figure>

            {Array.isArray(cur.tags) && cur.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {cur.tags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="
                      inline-flex items-center rounded-full
                      bg-[var(--brand-50)]/70 dark:bg-[var(--brand-600)]/12
                      px-3 py-1 text-xs font-medium
                      text-[var(--brand-700)] dark:text-[var(--brand-200)]
                      ring-1 ring-[var(--border-1)]
                    "
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </aside>

          {/* Texto */}
          <div className="min-w-0">
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-1)]">
              {cur.name}
            </h3>
            {cur.degree && <p className="mt-1 text-[var(--text-2)]">{cur.degree}</p>}

            {cur.lead && (
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-1)]">
                {cur.lead}
              </p>
            )}

            {Array.isArray(cur.bullets) && cur.bullets.length > 0 && (
              <ul className="mt-5 space-y-3">
                {cur.bullets.slice(0, 3).map((b, idx) => (
                  <li
                    key={`b-${idx}`}
                    className="
                      rounded-xl border border-[var(--border-1)]
                      bg-[var(--surface-0)]/60 dark:bg-white/[0.03]
                      px-4 py-3 text-[15px] leading-relaxed text-[var(--text-2)]
                    "
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => onContactProfile?.(cur)}
                className="
                  inline-flex items-center rounded-full
                  bg-[var(--brand-600)] px-5 py-2.5
                  text-sm font-semibold text-white
                  shadow-sm hover:shadow-md transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]
                "
              >
                Contactar
              </button>
              <button
                onClick={() => onLoginProfile?.(cur)}
                className="
                  inline-flex items-center rounded-full
                  border border-[var(--border-1)]
                  bg-[var(--surface-0)] px-5 py-2.5
                  text-sm font-semibold text-[var(--text-1)]
                  hover:bg-[var(--brand-50)] dark:hover:bg-[var(--brand-600)]/10
                "
              >
                Agendar
              </button>
            </div>
          </div>
        </article>
      </div>

      {/* Dots */}
      {data.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {data.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Ir a ${idx + 1}`}
              onClick={() => { setI(idx); restart(); }}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === idx
                  ? "bg-[var(--brand-600)]"
                  : "bg-[var(--text-2)]/40 hover:bg-[var(--text-2)]/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
