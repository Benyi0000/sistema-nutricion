// src/components/consultas/InputByType.jsx
import React from "react";

function normTipo(raw) {
    const v = String(raw || "").toLowerCase().trim();
    const MAP = {
        // multi
        multi: "multi", "opcion_multiple": "multi", "multi_choice": "multi", checkbox: "multi",
        // single
        single: "single", "opcion_unica": "single", "single_choice": "single", radio: "single", select: "single",
        // boolean
        boolean: "boolean", "si_no": "boolean", "yes_no": "boolean",
        // text
        text: "text", "short_text": "text", "long_text": "text", texto: "text", "texto_corto": "text", "texto_largo": "text",
        // integer / decimal
        integer: "integer", entero: "integer",
        decimal: "decimal", float: "decimal", number: "decimal", numeric: "decimal", numero: "decimal",
        // date
        date: "date", fecha: "date",
    };
    return MAP[v] || "text";
    }

    function normOpciones(opcs) {
    const arr = Array.isArray(opcs) ? opcs : [];
    return arr
        .map((x) =>
        typeof x === "string"
            ? {
                valor: x.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "") || "opt",
                etiqueta: x.trim(),
            }
            : {
                valor:
                (x?.valor ||
                    (x?.etiqueta || x?.label || "")
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_-]/g, "")) || "opt",
                etiqueta: (x?.etiqueta || x?.label || x?.valor || "").trim(),
            }
        )
        .filter((o) => o.etiqueta);
    }

    export default function InputByType({ q, value, onChange }) {
    const tipo = normTipo(q?.tipo);
    const opciones = normOpciones(q?.opciones);

    // ---- text
    if (tipo === "text") {
        return (
        <input
            type="text"
            className="border p-2 rounded w-full"
            placeholder="Escribe aquí..."
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
        />
        );
    }

    // ---- integer
    if (tipo === "integer") {
        const val = value ?? "";
        return (
        <input
            type="number"
            step={1}
            className="border p-2 rounded w-full"
            value={val}
            onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : parseInt(v, 10));
            }}
        />
        );
    }

    // ---- decimal
    if (tipo === "decimal") {
        const val = value ?? "";
        return (
        <input
            type="number"
            step="any"
            className="border p-2 rounded w-full"
            value={val}
            onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : parseFloat(v));
            }}
        />
        );
    }

    // ---- boolean
    if (tipo === "boolean") {
        const v = value === true ? "true" : value === false ? "false" : "";
        return (
        <select
            className="border p-2 rounded w-full"
            value={v}
            onChange={(e) => {
            const s = e.target.value;
            onChange(s === "" ? null : s === "true");
            }}
        >
            <option value="">Seleccionar…</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
        </select>
        );
    }

    // ---- date
    if (tipo === "date") {
        const val = value ?? "";
        return (
        <input
            type="date"
            className="border p-2 rounded w-full"
            value={val}
            onChange={(e) => onChange(e.target.value)}
        />
        );
    }

    // ---- single (opción única)
    if (tipo === "single") {
        if (opciones.length === 0) {
        return (
            <input
            type="text"
            className="border p-2 rounded w-full"
            placeholder="Escribe aquí..."
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            />
        );
        }
        return (
        <select
            className="border p-2 rounded w-full"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Seleccionar…</option>
            {opciones.map((opt) => (
            <option key={opt.valor} value={opt.valor}>
                {opt.etiqueta}
            </option>
            ))}
        </select>
        );
    }

    // ---- multi (checkboxes)
    if (tipo === "multi") {
        if (opciones.length === 0) {
        // si por algún motivo no hay opciones, caer a texto
        return (
            <input
            type="text"
            className="border p-2 rounded w-full"
            placeholder="Escribe aquí..."
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            />
        );
        }
        const selected = Array.isArray(value) ? value : [];
        const toggle = (val) => {
        if (selected.includes(val)) {
            onChange(selected.filter((x) => x !== val));
        } else {
            onChange([...selected, val]);
        }
        };
        return (
        <div className="flex flex-wrap gap-3">
            {opciones.map((opt) => (
            <label key={opt.valor} className="inline-flex items-center gap-2">
                <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.includes(opt.valor)}
                onChange={() => toggle(opt.valor)}
                />
                <span>{opt.etiqueta}</span>
            </label>
            ))}
        </div>
        );
    }

    // ---- fallback
    return (
        <input
        type="text"
        className="border p-2 rounded w-full"
        placeholder="Escribe aquí..."
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        />
    );
}
