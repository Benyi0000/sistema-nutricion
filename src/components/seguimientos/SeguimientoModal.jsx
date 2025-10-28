import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

export default function SeguimientoModal({ seguimiento, paciente, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    // Focus trap
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Fecha no disponible";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Por ahora, usar la función de impresión del navegador
    // que permite "Guardar como PDF"
    window.print();
  };

  const metricas = seguimiento.metricas || {};
  const respuestas = seguimiento.respuestas || [];

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Detalle del Seguimiento
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(seguimiento.fecha)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              {seguimiento.tipo || "Seguimiento"}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Información del paciente */}
          {paciente && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Paciente</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {paciente.nombre} {paciente.apellido}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">DNI:</span>{" "}
                  <span className="font-medium text-gray-900">{paciente.dni}</span>
                </div>
                <div>
                  <span className="text-gray-600">Edad:</span>{" "}
                  <span className="font-medium text-gray-900">{paciente.edad} años</span>
                </div>
                <div>
                  <span className="text-gray-600">Género:</span>{" "}
                  <span className="font-medium text-gray-900">{paciente.genero}</span>
                </div>
              </div>
            </div>
          )}

          {/* Métricas */}
          {Object.keys(metricas).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Métricas
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(metricas).map(([key, value]) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 capitalize">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Respuestas */}
          {respuestas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Datos Registrados
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({respuestas.length} {respuestas.length === 1 ? "registro" : "registros"})
                </span>
              </h3>
              <div className="space-y-4">
                {respuestas.map((r, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">
                      {r.pregunta}
                      {r.requerido && <span className="text-red-600 ml-1">*</span>}
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-gray-900">
                        {Array.isArray(r.valor) ? r.valor.join(", ") : r.valor || "-"}
                      </span>
                      {r.unidad && (
                        <span className="text-sm text-gray-600">{r.unidad}</span>
                      )}
                    </div>

                    {r.observacion && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600 italic">
                          Observación: {r.observacion}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {seguimiento.notas && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Notas / Indicaciones
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{seguimiento.notas}</p>
              </div>
            </div>
          )}

          {/* Plantilla snapshot (si existe) */}
          {seguimiento.plantilla_snapshot && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Plantilla Utilizada
              </h3>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="font-medium text-indigo-900">
                  {seguimiento.plantilla_snapshot.nombre}
                </div>
                {seguimiento.plantilla_snapshot.descripcion && (
                  <p className="text-sm text-indigo-700 mt-1">
                    {seguimiento.plantilla_snapshot.descripcion}
                  </p>
                )}
                <p className="text-xs text-indigo-600 mt-2">
                  {seguimiento.plantilla_snapshot.preguntas?.length || 0} preguntas configuradas
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
              Esc
            </kbd>{" "}
            para cerrar
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* CSS para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
