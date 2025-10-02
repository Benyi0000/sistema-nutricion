import { useState, useEffect } from "react";

export default function ObservationField({ value, onChange, disabled = false, maxLength = 1000 }) {
    const [open, setOpen] = useState(Boolean(value && value.length));
    const [text, setText] = useState(value || "");

    useEffect(() => {
        setText(value || "");
    }, [value]);

    return (
        <div className="mt-2">
        <button
            type="button"
            className="text-sm text-indigo-600 hover:underline"
            onClick={() => setOpen((v) => !v)}
            disabled={disabled}
        >
            {open ? "Ocultar observación" : text ? "Editar observación" : "Agregar observación"}
        </button>

        {open && (
            <div className="mt-2">
            <textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Contexto, detalles, frecuencia, recomendaciones…"
                value={text}
                maxLength={maxLength}
                onChange={(e) => {
                const v = e.target.value;
                setText(v);
                if (onChange) onChange(v);
                }}
                disabled={disabled}
            />
            <div className="mt-1 text-right text-xs text-gray-500">
                {(text?.length || 0)}/{maxLength}
            </div>
            </div>
        )}
        </div>
    );
}
