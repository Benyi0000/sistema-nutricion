import { useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WHATSAPP_PHONE } from "../../lib/config";

// Saludo por hora (desde i18n)
function greetingByHour(h, t) {
  if (h < 12) return t("whatsapp.greetings.morning");
  if (h < 19) return t("whatsapp.greetings.afternoon");
  return t("whatsapp.greetings.evening");
}

export default function FabWhatsApp({ className = "" }) {
  const { t, i18n } = useTranslation();
  const [showTip, setShowTip] = useState(false);
  const tipTimer = useRef(null);

  // Mensaje final traducido
  const message = useMemo(() => {
    const now = new Date();
    const g = greetingByHour(now.getHours(), t);
    return `${g} ${t("whatsapp.message")}`;
  }, [i18n.language, t]);

  const waLink = useMemo(() => {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
  }, [message]);

  // Permite abrir el chat desde otro CTA (dispatch CustomEvent)
  useEffect(() => {
    const open = () => setShowTip(true);
    window.addEventListener("open-whatsapp", open);
    return () => window.removeEventListener("open-whatsapp", open);
  }, []);

  // Handlers que evitan “parpadeo” al salir/entrar brevemente
  const onEnter = () => {
    clearTimeout(tipTimer.current);
    setShowTip(true);
  };
  const onLeave = () => {
    // Delay pequeño para que no “titee” mientras se mueve el cursor
    tipTimer.current = setTimeout(() => setShowTip(false), 120);
  };

  return (
    <div
      className={`fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50 ${className}`}
      aria-live="polite"
    >
      {/* Contenedor con group-hover: el tooltip no captura el hover */}
      <div
        className="group relative"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
      >
        {/* Tooltip flotante - no interfiere con el hover del botón */}
        <div
          className={[
            "absolute -top-2 right-14 translate-y-[-50%] px-3 py-2 rounded-xl",
            "text-sm shadow-lg border",
            "bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-gray-100",
            "backdrop-blur supports-[backdrop-filter]:bg-white/80",
            "pointer-events-none",                   // <- clave para que NO robe el hover
            "transition-opacity duration-150",
            showTip ? "opacity-100" : "opacity-0"
          ].join(" ")}
          role="status"
        >
          {t("whatsapp.tooltip")}
        </div>

        {/* Botón */}
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          title="WhatsApp"
          className={[
            "inline-flex h-14 w-14 items-center justify-center rounded-full",
            "shadow-lg bg-[#25D366] text-white",
            "hover:brightness-105 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
            "transition-transform"
          ].join(" ")}
        >
          {/* Ícono svg (sin dependencias) */}
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
            <path d="M20.52 3.48A11.86 11.86 0 0012.01 0C5.38 0 0 5.38 0 12.01c0 2.12.56 4.17 1.63 5.98L0 24l6.18-1.62a11.95 11.95 0 005.83 1.53h.01c6.63 0 12.01-5.38 12.01-12.01 0-3.2-1.25-6.2-3.51-8.42zM12.02 22a9.95 9.95 0 01-5.07-1.39l-.36-.21-3.67.96.98-3.58-.23-.37A9.96 9.96 0 1122 12.01C22 17.52 17.53 22 12.02 22zm5.73-7.46c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.47.13-.62.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.64-.94-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.52.08-.8.37-.28.3-1.06 1.03-1.06 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.11 3.22 5.1 4.52.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.31.17-1.43-.08-.12-.27-.19-.56-.34z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
