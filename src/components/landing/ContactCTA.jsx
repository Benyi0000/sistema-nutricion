// src/components/landing/ContactCTA.jsx
import { useTranslation } from "react-i18next";

/* =========  ICONOS SVG (reutilizables)  ========= */

const PinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
    <path strokeWidth="1.8" d="M12 22s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z" />
    <circle cx="12" cy="10" r="2.8" strokeWidth="1.8" />
  </svg>
);

const PhoneIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
    <path strokeWidth="1.8" d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.2 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 3.9 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.2 1.1.5 2.1.8 3.1a2 2 0 0 1-.5 2L7 10a16 16 0 0 0 7 7l1.3-1.4a2 2 0 0 1 2-.5c1 .3 2 .6 3.1.8A2 2 0 0 1 22 16.9Z"/>
  </svg>
);

const MailIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" />
    <path d="M3 7.5 12 13l9-5.5" strokeWidth="1.8" />
  </svg>
);

const ClockIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
    <path d="M12 7v5l3 2" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* Redes sociales */
const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-label="Facebook" {...props}>
    <path d="M22 12.06C22 6.48 17.52 2 11.94 2 6.36 2 1.88 6.48 1.88 12.06c0 5.03 3.68 9.2 8.49 9.94v-7.03H7.99v-2.9h2.38V9.64c0-2.35 1.4-3.65 3.54-3.65 1.02 0 2.08.18 2.08.18v2.29h-1.17c-1.16 0-1.52.72-1.52 1.46v1.75h2.59l-.41 2.9h-2.18V22c4.81-.74 8.49-4.91 8.49-9.94Z"/>
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-label="Instagram" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="3.2" strokeWidth="1.6"/>
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor"/>
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-label="X" {...props}>
    <path d="M4 3h4.6L13 9.2 17.7 3H20l-6.3 8.2L20.5 21H16l-5-6.6L6 21H3.6l7.1-9.1L4 3Z"/>
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-label="WhatsApp" {...props}>
    <path d="M20.5 3.5A10 10 0 0 0 3.6 16.6L3 21l4.5-1A10 10 0 0 0 20.5 3.5Zm-8.5 16a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm4.3-5.2c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1-.1.2-.6.7-.7.8-.1.1-.3.1-.5 0a6.6 6.6 0 0 1-3-2.7c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.1-.5l-.6-1.5c-.2-.4-.4-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.7.8-1 1.8-.9 2.8.1 1 .7 2 .9 2.2.2.3 1.5 2.5 3.8 3.4 2.4 1 2.4.6 2.9.6.4 0 1.3-.5 1.5-1 .2-.5.2-1 .2-1.1 0-.1-.1-.2-.3-.3Z"/>
  </svg>
);

/* Contenedor circular para íconos de la columna izquierda */
function IconCircle({ children }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-[var(--brand-700)] ring-1 ring-white/60 dark:bg-white/10 dark:text-[var(--brand-200)] dark:ring-white/20">
      {children}
    </span>
  );
}

/* Botón social genérico */
function SocialButton({ href = "#", label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-[var(--border-1)] bg-white/80 text-[var(--brand-700)] hover:bg-white transition dark:bg-white/10 dark:text-[var(--brand-200)]"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

export default function ContactCTA() {
  const { t } = useTranslation();

  const openWhats = (prefill = "") => {
    window.dispatchEvent(new CustomEvent("open-whatsapp", { detail: { prefill } }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name")?.toString()?.trim() ?? "";
    const lastname = fd.get("lastname")?.toString()?.trim() ?? "";
    const email = fd.get("email")?.toString()?.trim() ?? "";
    const phone = fd.get("phone")?.toString()?.trim() ?? "";
    const goal = fd.get("goal")?.toString()?.trim() ?? "";
    const message = fd.get("message")?.toString()?.trim() ?? "";

    const composed =
      `Hola, soy ${name} ${lastname}.` +
      (goal ? ` Objetivo: ${goal}.` : "") +
      (phone ? ` Tel: ${phone}.` : "") +
      (email ? ` Email: ${email}.` : "") +
      (message ? `\n\nMensaje: ${message}` : "");
    openWhats(composed);
  };

  return (
    <section
      className="
        relative py-16 md:py-24
        bg-gradient-to-b from-[var(--brand-50)]/90 to-[var(--brand-100)]/70
        dark:from-[var(--brand-800)]/30 dark:to-[var(--brand-700)]/20
      "
      aria-labelledby="cta-title"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <header className="text-center">
          <h2 id="cta-title" className="text-2xl md:text-3xl font-extrabold text-[var(--text-1)]">
            {t("cta.title")}
          </h2>
          <p className="mt-2 max-w-2xl mx-auto text-[var(--text-2)]">
            {t("cta.lead")}
          </p>
        </header>

        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(260px,1fr)_minmax(320px,520px)]">
          {/* Columna izquierda: datos de contacto */}
          <aside className="space-y-6">
            <div className="flex items-start gap-3">
              <IconCircle><PinIcon className="h-4 w-4" /></IconCircle>
              <div className="text-sm">
                <p className="font-semibold text-[var(--text-1)]">Ubicación</p>
                <p className="text-[var(--text-2)]">Buenos Aires, Argentina</p>
                <p className="text-[var(--text-2)]">Consultas presenciales y virtuales</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IconCircle><PhoneIcon className="h-4 w-4" /></IconCircle>
              <div className="text-sm">
                <p className="font-semibold text-[var(--text-1)]">WhatsApp</p>
                <p className="text-[var(--text-2)]">+54 9 11 2345-6789</p>
                <p className="text-[var(--text-2)]">Lun a Vie: 9:00 – 18:00</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IconCircle><MailIcon className="h-4 w-4" /></IconCircle>
              <div className="text-sm">
                <p className="font-semibold text-[var(--text-1)]">Email</p>
                <p className="text-[var(--text-2)]">leila.olmedo@nutrisalud.com</p>
                <p className="text-[var(--text-2)]">Respuesta en 24hs</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IconCircle><ClockIcon className="h-4 w-4" /></IconCircle>
              <div className="text-sm">
                <p className="font-semibold text-[var(--text-1)]">Horarios</p>
                <p className="text-[var(--text-2)]">Lunes a Viernes: 9:00 – 19:00</p>
                <p className="text-[var(--text-2)]">Sábados: 9:00 – 13:00</p>
              </div>
            </div>

            <hr className="mt-8 border-white/50 dark:border-white/10" />

            <p className="text-center text-sm text-[var(--text-2)]">Síguenos en redes sociales</p>

            {/* Logos sociales SVG */}
            <div className="flex items-center justify-center gap-3">
              <SocialButton label="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </SocialButton>
              <SocialButton label="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </SocialButton>
              <SocialButton label="X">
                <XIcon className="h-4 w-4" />
              </SocialButton>
              <SocialButton label="WhatsApp" href="#">
                <WhatsAppIcon className="h-4 w-4" />
              </SocialButton>
            </div>
          </aside>

          {/* Columna derecha: formulario */}
          <div className="rounded-2xl bg-[var(--surface-2)]/70 p-5 md:p-6 ring-1 ring-[var(--border-1)] shadow-[0_10px_24px_rgba(17,17,26,0.12)] backdrop-blur-sm">
            <h3 className="text-base font-semibold mb-4 text-[var(--text-1)]">
              Solicita tu Consulta
            </h3>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="mb-1 inline-block opacity-90">Nombre *</span>
                  <input
                    name="name"
                    required
                    className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
                    placeholder="Tu nombre"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 inline-block opacity-90">Apellido *</span>
                  <input
                    name="lastname"
                    required
                    className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
                    placeholder="Tu apellido"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 inline-block opacity-90">Email *</span>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
                  placeholder="tu@email.com"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 inline-block opacity-90">Teléfono</span>
                <input
                  name="phone"
                  className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
                  placeholder="+54 9 11 1234 5678"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 inline-block opacity-90">¿Cuál es tu objetivo? *</span>
                <select
                  name="goal"
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
                  defaultValue=""
                >
                  <option value="" disabled>Selecciona tu objetivo</option>
                  <option>Pérdida de peso</option>
                  <option>Rendimiento deportivo</option>
                  <option>Recomposición corporal</option>
                  <option>Educación alimentaria</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 inline-block opacity-90">Mensaje</span>
                <textarea
                  name="message"
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
                  placeholder="Cuéntanos más sobre tus objetivos, restricciones, etc."
                />
              </label>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]"
                >
                  {t("cta.button")}
                </button>
              </div>
            </form>

            <p className="mt-3 text-center text-xs text-[var(--text-2)]/80">
              Te contactaremos en menos de 24 horas para coordinar tu consulta inicial.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
