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
  categorias = [],
}) {
  const lista = Array.isArray(preguntas) ? preguntas : [];
  const categoriasOrdenadas = Array.isArray(categorias)
    ? [...categorias].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    : [];

  const categoriaIds = new Set(categoriasOrdenadas.map((cat) => String(cat.id)));

  const sinCategoria = lista.filter((q) => {
    const catId = q.categoria !== undefined && q.categoria !== null ? String(q.categoria) : null;
    return !catId || !categoriaIds.has(catId);
  });

  const preguntasPorCategoria = categoriasOrdenadas.map((cat) => {
    const catId = String(cat.id);
    return {
      cat,
      preguntas: lista.filter((q) => {
        const qCatId = q.categoria !== undefined && q.categoria !== null ? String(q.categoria) : null;
        return qCatId === catId;
      }),
    };
  });

  const renderPregunta = (q) => {
    const isChecked = !!seleccion[q.id];
    return (
      <div
        key={q.id}
        className={`rounded border p-3 ${isChecked ? 'bg-white' : 'bg-gray-50'}`}
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
              {q.texto}{' '}
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
              value={obs[q.id] ?? ''}
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
  };

  const renderBloque = (preguntasBloque) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {preguntasBloque.map(renderPregunta)}
    </div>
  );

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

      {preguntasPorCategoria.map(({ cat, preguntas }) =>
        preguntas.length > 0 ? (
          <div key={cat.id} className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {cat.nombre}
            </h4>
            {renderBloque(preguntas)}
          </div>
        ) : null
      )}

      {sinCategoria.length > 0 && (
        <div className={`space-y-3 ${categoriasOrdenadas.length > 0 ? 'mt-6' : ''}`}>
          {categoriasOrdenadas.length > 0 && (
            <h4 className="text-sm font-semibold text-gray-600">Sin categoría</h4>
          )}
          {renderBloque(sinCategoria)}
        </div>
      )}
    </div>
  );
}
