// src/components/consultas/PreguntasForm.jsx
import React from "react";
import InputByType from "./InputByType";
import ObservationField from "../forms/ObservationField";

export default function PreguntasForm({
    preguntas,
    seleccion,
    valores,
    obs,
    toggleSel,
    setVal,
    setOb,
    }) {
    const lista = Array.isArray(preguntas) ? preguntas : [];

    return (
        <div className="md:col-span-2 rounded border p-4">
        <div className="flex items-center justify-between">
            <h3 className="font-medium mb-3">Seleccioná preguntas</h3>
            <span className="text-xs text-gray-500">{lista.length} encontrada(s)</span>
        </div>

        {lista.length === 0 && (
            <div className="rounded border border-dashed p-4 text-sm text-gray-500 bg-gray-50">
            No hay preguntas disponibles para este alcance.
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lista.map((q) => {
            const isChecked = !!seleccion[q.id];
            return (
                <div
                key={q.id}
                className={`rounded border p-3 ${isChecked ? "bg-white" : "bg-gray-50"}`}
                >
                <label className="flex items-start gap-2">
                    <input
                    type="checkbox"
                    className="mt-1"
                    checked={isChecked}
                    onChange={() => toggleSel(q.id)}
                    />
                    <div className="flex-1">
                    <div className="font-medium">
                        {q.texto}{" "}
                        {q.unidad && <span className="text-gray-500">({q.unidad})</span>}
                        {q.requerido && <span className="text-red-600 text-xs ml-2">*</span>}
                    </div>

                    <div className="mt-2">
                        <InputByType
                        q={q}
                        value={valores[q.id]}
                        onChange={(v) => setVal(q.id, v)}
                        disabled={!isChecked}
                        />
                    </div>

                    <ObservationField
                        value={obs[q.id] ?? ""}
                        onChange={(txt) => setOb(q.id, txt)}
                        disabled={!isChecked}
                    />

                    {q.codigo && (
                        <div className="mt-1 text-[11px] text-gray-500">Código: {q.codigo}</div>
                    )}
                    </div>
                </label>
                </div>
            );
            })}
        </div>
        </div>
    );
}
