import { useState } from "react";

/**
 * onSave(payload) => Promise<preguntaCreada>
 * payload:
 *  { texto, tipo, requerido, unidad, opciones? (array de strings o {valor, etiqueta}) }
 */
export default function PersonalizadaBuilder({ onSave }) {
    const [open, setOpen] = useState(false);
    const [texto, setTexto] = useState("");
    const [tipo, setTipo] = useState("short_text");
    const [requerido, setRequerido] = useState(false);
    const [unidad, setUnidad] = useState("");
    const [optText, setOptText] = useState("");
    const [opciones, setOpciones] = useState([]);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const isMulti = ["multi_choice", "opcion_multiple", "checkbox"].includes(tipo) || tipo === "opcion_multiple";

    const addOpcion = () => {
        const t = (optText || "").trim();
        if (!t) return;
        if (!opciones.find((o) => (o.etiqueta || o) === t)) {
        setOpciones((prev) => [...prev, t]);
        }
        setOptText("");
    };
    const removeOpcion = (idx) => {
        setOpciones((prev) => prev.filter((_, i) => i !== idx));
    };

    const guardar = async () => {
        setErr("");
        if (!texto.trim()) { setErr("Escribe el texto de la pregunta."); return; }
        if (isMulti && opciones.length === 0) { setErr("Agregá al menos una opción."); return; }

        const payload = {
        texto: texto.trim(),
        tipo,
        requerido,
        unidad: unidad.trim() || null,
        opciones: isMulti ? opciones : [],
        };

        try {
        setSaving(true);
        const created = await onSave?.(payload);
        // limpiar y cerrar
        setTexto(""); setTipo("short_text"); setRequerido(false);
        setUnidad(""); setOpciones([]); setOpen(false);
        return created;
        } catch (e) {
        setErr(e?.detail || "No se pudo guardar la pregunta.");
        } finally {
        setSaving(false);
        }
    };

    return (
        <div className="rounded border p-3 bg-white">
        <button
            type="button"
            className="px-3 py-2 rounded bg-emerald-600 text-white"
            onClick={() => setOpen((v) => !v)}
        >
            {open ? "Cancelar" : "Agregar pregunta personalizada"}
        </button>

        {open && (
            <div className="mt-3 space-y-2">
            {err && (
                <div className="rounded border border-red-300 bg-red-50 text-red-800 p-2 text-sm">
                {err}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium">Texto</label>
                <input
                type="text"
                className="w-full border rounded p-2"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="¿Cuántas veces come al día?"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                <label className="block text-sm font-medium">Tipo</label>
                <select
                    className="w-full border rounded p-2"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                >
                    <option value="short_text">Texto corto</option>
                    <option value="long_text">Texto largo</option>
                    <option value="numero">Numérico</option>
                    <option value="fecha">Fecha</option>
                    <option value="opcion_multiple">Opción múltiple (checkbox)</option>
                    <option value="opcion_unica">Opción única (select)</option>
                </select>
                </div>

                <div>
                <label className="block text-sm font-medium">Unidad (opcional)</label>
                <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    placeholder="kg, cm, veces/día…"
                />
                </div>

                <label className="flex items-end gap-2">
                <input
                    type="checkbox"
                    checked={requerido}
                    onChange={(e) => setRequerido(e.target.checked)}
                />
                <span>Requerida</span>
                </label>
            </div>

            {isMulti && (
                <div className="mt-2">
                <label className="block text-sm font-medium">Opciones</label>
                <div className="flex gap-2">
                    <input
                    type="text"
                    className="flex-1 border rounded p-2"
                    placeholder='Ej: "Desayuno"'
                    value={optText}
                    onChange={(e) => setOptText(e.target.value)}
                    />
                    <button
                    type="button"
                    className="px-3 py-2 rounded bg-indigo-600 text-white"
                    onClick={addOpcion}
                    >
                    Añadir
                    </button>
                </div>
                {opciones.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                    {opciones.map((o, i) => (
                        <span key={i} className="inline-flex items-center gap-2 px-2 py-1 rounded border text-sm">
                        {typeof o === "string" ? o : (o.etiqueta || o.valor)}
                        <button type="button" onClick={() => removeOpcion(i)} title="Quitar">✕</button>
                        </span>
                    ))}
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Podés escribir cualquier opción, por ejemplo: “Come mucho”.
                </p>
                </div>
            )}

            <div className="pt-2">
                <button
                type="button"
                className="px-4 py-2 rounded text-white"
                style={{ backgroundColor: saving ? "#7C3AED80" : "#7C3AED" }}
                onClick={guardar}
                disabled={saving}
                >
                {saving ? "Guardando…" : "Guardar en banco y agregar"}
                </button>
            </div>
            </div>
        )}
        
        </div>
        
    );
}
