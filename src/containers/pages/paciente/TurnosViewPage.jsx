import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  useGetAvailableSlotsQuery,
  useGetTiposConsultaQuery,
  useGetUbicacionesQuery,
  useSolicitarTurnoMutation,
} from "../../../features/agenda/agendaApiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, startOfDay, endOfDay, parseISO, formatISO } from "date-fns";
import { es } from "date-fns/locale";

// Componente simple de Modal (solo para confirmar con notas)
const ModalConfirmacion = ({ slot, tipoConsulta, ubicacion, nutricionistaId, onClose, onSubmit }) => {
  const [notas, setNotas] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const turnoData = {
      nutricionista: nutricionistaId,
      slot_inicio: slot.inicio,
      slot_fin: slot.fin,
      tipo_consulta_id: tipoConsulta.id,  // Cambiado: tipo_consulta -> tipo_consulta_id
      ubicacion_id: ubicacion.id,         // Cambiado: ubicacion -> ubicacion_id
      notas_paciente: notas,
    };
    onSubmit(turnoData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay oscuro semitransparente */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      ></div>
      
      {/* Modal contenido */}
      <div className="relative bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg mx-4 z-10">
        <h2 className="text-2xl font-semibold mb-4">Confirmar Turno</h2>
        <p className="text-lg mb-2">
          Día:{" "}
          <span className="font-medium">
            {format(parseISO(slot.inicio), "eeee dd 'de' MMMM", { locale: es })}
          </span>
        </p>
        <p className="text-lg mb-2">
          Hora:{" "}
          <span className="font-medium">
            {format(parseISO(slot.inicio), "HH:mm")}
          </span>{" "}
          - <span className="font-medium">
            {format(parseISO(slot.fin), "HH:mm")}
          </span>
        </p>
        <p className="text-base mb-2">
          Tipo de consulta:{" "}
          <span className="font-medium">
            {tipoConsulta.tipo_display || tipoConsulta.tipo} (${tipoConsulta.precio})
          </span>
        </p>
        <p className="text-base mb-6">
          Ubicación:{" "}
          <span className="font-medium">
            {ubicacion.nombre} ({ubicacion.is_virtual ? "Virtual" : "Presencial"})
          </span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="notas"
              className="block text-sm font-medium text-gray-700"
            >
              Notas para el nutricionista (Opcional)
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ej: Motivo de la consulta, etc."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Solicitar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de la Página
const TurnosViewPage = () => {
  const user = useSelector(selectCurrentUser);
  const nutricionistaId = user?.nutricionista_id;

  // Estados para el flujo paso a paso
  const [selectedTipoConsulta, setSelectedTipoConsulta] = useState(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null); // Para el modal

  // Obtener tipos de consulta y ubicaciones
  const { data: tiposConsulta = [], isLoading: loadingTipos } =
    useGetTiposConsultaQuery(nutricionistaId, {
      skip: !nutricionistaId,
    });

  const { data: ubicaciones = [], isLoading: loadingUbicaciones } =
    useGetUbicacionesQuery(nutricionistaId, {
      skip: !nutricionistaId,
    });

  // Formatear fechas para la query de RTK
  const queryDates = useMemo(() => {
    if (!selectedDay) {
      return { fecha_inicio: null, fecha_fin: null };
    }
    
    try {
      const dayStart = startOfDay(selectedDay);
      const dayEnd = endOfDay(selectedDay);
      const fecha_inicio = formatISO(dayStart);
      const fecha_fin = formatISO(dayEnd);
      
      console.log('📅 Fechas calculadas:', { 
        selectedDay, 
        dayStart, 
        dayEnd, 
        fecha_inicio, 
        fecha_fin 
      });
      
      return { fecha_inicio, fecha_fin };
    } catch (error) {
      console.error('❌ Error al formatear fechas:', error);
      return { fecha_inicio: null, fecha_fin: null };
    }
  }, [selectedDay]);

  // Hook para solicitar turnos
  const [solicitarTurno, { isLoading: isSolicitando, isSuccess, isError, error }] =
    useSolicitarTurnoMutation();

  // Hook para obtener slots
  const {
    data: availableSlots = [],
    isLoading: isLoadingSlots,
    isFetching: isFetchingSlots,
  } = useGetAvailableSlotsQuery(
    {
      nutricionistaId,
      fechaInicio: queryDates.fecha_inicio,
      fechaFin: queryDates.fecha_fin,
      duracion: selectedTipoConsulta?.duracion_min, // Agregar duración del tipo de consulta
      ubicacionId: selectedUbicacion?.id,
      tipoConsultaId: selectedTipoConsulta?.id, // NUEVO: Pasar ID para obtener buffers específicos
    },
    {
      skip: !nutricionistaId || !queryDates.fecha_inicio || !queryDates.fecha_fin || !selectedUbicacion || !selectedTipoConsulta, // Requiere tipo de consulta Y ubicación
    }
  );

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const handleCloseModal = () => {
    setSelectedSlot(null);
  };

  const handleSubmitSolicitud = async (turnoData) => {
    try {
      console.log("📤 Datos enviados:", turnoData);
      await solicitarTurno(turnoData).unwrap();
      // El éxito se maneja con 'isSuccess'
      setSelectedSlot(null);
    } catch (err) {
      // El error se maneja con 'isError'
      console.error("❌ Error al solicitar turno:", err);
      
      // Manejo de errores de políticas de anticipación
      if (err?.data?.error) {
        const errorMsg = err.data.error;
        alert(
          `⚠️ No se puede reservar este turno\n\n${errorMsg}\n\n` +
          `Por favor, seleccione otro horario o contacte al nutricionista.`
        );
        setSelectedSlot(null);
        return;
      }
      
      if (err.data) {
        // Si es HTML, no imprimir carácter por carácter
        if (typeof err.data === 'string' && err.data.includes('<!DOCTYPE')) {
          console.error("📋 Error HTML del servidor (ver terminal Django)");
        } else {
          console.error("📋 Detalles del error:", err.data);
          if (err.data.non_field_errors) {
            console.error("🚨 Errores de validación:", err.data.non_field_errors);
          }
          // Mostrar todos los errores de campo
          Object.keys(err.data).forEach(key => {
            console.error(`  ${key}:`, err.data[key]);
          });
        }
      }
    }
  };
  
  if (!nutricionistaId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Solicitar Turno
        </h1>
        <p className="mt-4 text-red-600">
          No tienes un nutricionista asignado. Por favor, contacta a
          administración.
        </p>
      </div>
    );
  }

  // Estilos para react-day-picker (Tailwind)
  const css = `
    .rdp {
      --rdp-cell-size: 48px;
      --rdp-accent-color: #3b82f6; // blue-500
      margin: 0;
    }
    .rdp-head_cell {
      font-weight: 600;
      font-size: 0.875rem;
    }
    .rdp-day_today {
      font-weight: 800;
      color: #1d4ed8; // blue-700
    }
  `;

  return (
    <div>
      {/* Modal de Confirmación */}
      {selectedSlot && selectedTipoConsulta && selectedUbicacion && (
        <ModalConfirmacion
          slot={selectedSlot}
          tipoConsulta={selectedTipoConsulta}
          ubicacion={selectedUbicacion}
          nutricionistaId={nutricionistaId}
          onClose={handleCloseModal}
          onSubmit={handleSubmitSolicitud}
        />
      )}

      {/* Notificaciones de Éxito/Error */}
      {isSuccess && (
        <div className="m-4 p-4 bg-green-100 text-green-800 border border-green-300 rounded-md">
          ¡Turno solicitado con éxito! Recibirás una confirmación cuando el
          nutricionista lo apruebe.
        </div>
      )}
      {isError && (
        <div className="m-4 p-4 bg-red-100 text-red-800 border border-red-300 rounded-md">
          Error al solicitar el turno:{" "}
          {error?.data?.detail || "Intente nuevamente."}
        </div>
      )}

      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Solicitar Turno
        </h1>

        {/* Paso 1: Selección de Tipo de Consulta */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Paso 1: Selecciona el tipo de consulta
          </h2>
          {loadingTipos ? (
            <p className="text-gray-600">Cargando tipos de consulta...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiposConsulta.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => {
                    setSelectedTipoConsulta(tipo);
                    setSelectedUbicacion(null); // Reset ubicación al cambiar tipo
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedTipoConsulta?.id === tipo.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-300"
                  }`}
                >
                  <h3 className="font-semibold text-lg">{tipo.tipo_display || tipo.tipo}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Duración: {tipo.duracion_min} minutos
                  </p>
                  <p className="text-sm font-medium text-blue-600 mt-1">
                    ${tipo.precio}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paso 2: Selección de Ubicación (solo si hay tipo de consulta seleccionado) */}
        {selectedTipoConsulta && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Paso 2: Selecciona la ubicación
            </h2>
            {loadingUbicaciones ? (
              <p className="text-gray-600">Cargando ubicaciones...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ubicaciones.map((ubicacion) => (
                  <button
                    key={ubicacion.id}
                    onClick={() => setSelectedUbicacion(ubicacion)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedUbicacion?.id === ubicacion.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    <h3 className="font-semibold text-lg">{ubicacion.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {ubicacion.is_virtual ? "💻 Virtual" : "🏢 Presencial"}
                    </p>
                    {ubicacion.direccion && !ubicacion.is_virtual && (
                      <p className="text-sm text-gray-500 mt-1">
                        📍 {ubicacion.direccion}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Paso 3 y 4: Calendario y Horarios (solo si hay tipo de consulta Y ubicación seleccionada) */}
        {selectedTipoConsulta && selectedUbicacion ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Paso 3: Selecciona día y horario
            </h2>

            <div className="flex flex-col md:flex-row gap-8">
          {/* Columna del Calendario */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <style>{css}</style>
            <DayPicker
              mode="single"
              selected={selectedDay}
              onSelect={setSelectedDay}
              locale={es}
              fromDate={new Date()} // Deshabilitar días pasados
              modifiersStyles={{
                disabled: { opacity: 0.4, cursor: "not-allowed" },
              }}
            />
          </div>

          {/* Columna de Slots */}
          <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Horarios disponibles para el{" "}
              {format(selectedDay, "eeee dd 'de' MMMM", { locale: es })}
            </h2>
            {(isLoadingSlots || isFetchingSlots) && (
              <p>Buscando horarios...</p>
            )}

            {!isLoadingSlots && !isFetchingSlots && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSlot(slot)}
                      disabled={isSolicitando}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg text-center font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
                    >
                      {format(parseISO(slot.inicio), "HH:mm")}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-full">
                    No hay horarios disponibles para este día.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
          </> 
        ) : selectedTipoConsulta ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800">
              👆 Por favor, selecciona una ubicación para continuar.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800">
              👆 Por favor, selecciona primero el tipo de consulta para continuar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnosViewPage;