export default function SiteFooter() {
  const col = "space-y-3 text-sm";
  const item = "block opacity-80 hover:opacity-100 transition";

  return (
    <footer className="pt-12 pb-10 bg-neutral-950/95 text-white dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        {/* Top */}
        <div className="grid gap-10 md:grid-cols-4">
          <div className={col}>
            <p className="text-base font-semibold">NutriSalud</p>
            <p className="opacity-70">
              Haciendo del mundo un lugar más saludable mediante hábitos simples y sostenibles.
            </p>

            <div className="mt-4 flex items-center gap-4 opacity-80">
              {["facebook","instagram","twitter","github"].map((k)=>(
                <span key={k} className="inline-block h-4 w-4 rounded-full bg-white/20" />
              ))}
            </div>
          </div>

          <div className={col}>
            <p className="text-base font-semibold">Soluciones</p>
            <a className={item} href="#">Planes</a>
            <a className={item} href="#">Analíticas</a>
            <a className={item} href="#">Comercio</a>
            <a className={item} href="#">Insights</a>
          </div>

          <div className={col}>
            <p className="text-base font-semibold">Soporte</p>
            <a className={item} href="#">Precios</a>
            <a className={item} href="#">Documentación</a>
            <a className={item} href="#">Guías</a>
            <a className={item} href="#">Estado</a>
          </div>

          <div className={col}>
            <p className="text-base font-semibold">Compañía</p>
            <a className={item} href="#">Nosotros</a>
            <a className={item} href="#">Blog</a>
            <a className={item} href="#">Empleos</a>
            <a className={item} href="#">Prensa</a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-white/10 pt-6 text-xs opacity-80">
          © {new Date().getFullYear()} NutriSalud. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
