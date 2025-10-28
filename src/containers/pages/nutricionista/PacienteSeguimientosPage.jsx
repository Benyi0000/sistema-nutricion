import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPacienteById } from "../../../features/nutri/nutriSlice";
import { fetchConsultasPaciente } from "../../../features/consultas/consultasSlice";
import SeguimientoModal from "../../../components/seguimientos/SeguimientoModal";

export default function PacienteSeguimientosPage() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const paciente = useSelector((s) => s.nutri.selected);
  const { items: consultas, status } = useSelector((s) => s.consultas);

  // Local state
  const [selectedSeguimiento, setSelectedSeguimiento] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(false);
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");

  useEffect(() => {
    if (pacienteId) {
      dispatch(fetchPacienteById(pacienteId));
      dispatch(fetchConsultasPaciente(pacienteId));
    }
  }, [pacienteId, dispatch]);

  // Filtrar y ordenar seguimientos
  const seguimientosFiltrados = useMemo(() => {
    if (!Array.isArray(consultas)) return [];

    let filtered = consultas.filter((c) => {
      // Filtrar solo seguimientos (excluir consulta inicial)
      if (c.tipo !== "SEGUIMIENTO") return false;

      // Filtro por tipo
      if (tipoFiltro !== "TODOS" && c.tipo !== tipoFiltro) return false;

      // Filtro por rango de fechas
      if (fechaDesde && c.fecha < fechaDesde) return false;
      if (fechaHasta && c.fecha > fechaHasta) return false;

      // Búsqueda en notas y respuestas
      if (busqueda) {
        const searchLower = busqueda.toLowerCase();
        const enNotas = (c.notas || "").toLowerCase().includes(searchLower);
        const enRespuestas = (c.respuestas || []).some(
          (r) =>
            (r.pregunta || "").toLowerCase().includes(searchLower) ||
            (r.valor?.toString() || "").toLowerCase().includes(searchLower) ||
            (r.observacion || "").toLowerCase().includes(searchLower)
        );
        return enNotas || enRespuestas;
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha || 0);
      const dateB = new Date(b.fecha || 0);
      return ordenAsc ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [consultas, tipoFiltro, fechaDesde, fechaHasta, busqueda, ordenAsc]);

  const consultaInicial = Array.isArray(consultas)
    ? consultas.find((c) => c.tipo === "INICIAL")
    : null;

  const handleVerSeguimiento = (seg) => {
    setSelectedSeguimiento(seg);
    setModalOpen(true);
  };

  const handlePresetFecha = (preset) => {
    const hoy = new Date();
    const desde = new Date();
    
    switch (preset) {
      case "HOY":
        desde.setHours(0, 0, 0, 0);
        setFechaDesde(desde.toISOString().split("T")[0]);
        setFechaHasta(hoy.toISOString().split("T")[0]);
        break;
      case "7_DIAS":
        desde.setDate(hoy.getDate() - 7);
        setFechaDesde(desde.toISOString().split("T")[0]);
        setFechaHasta(hoy.toISOString().split("T")[0]);
        break;
      case "30_DIAS":
        desde.setDate(hoy.getDate() - 30);
        setFechaDesde(desde.toISOString().split("T")[0]);
        setFechaHasta(hoy.toISOString().split("T")[0]);
        break;
      case "MES_ACTUAL":
        desde.setDate(1);
        setFechaDesde(desde.toISOString().split("T")[0]);
        setFechaHasta(hoy.toISOString().split("T")[0]);
        break;
      default:
        break;
    }
  };

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setBusqueda("");
    setTipoFiltro("TODOS");
  };

  const getInitials = (nombre, apellido) => {
    const n = (nombre || "")[0] || "";
    const a = (apellido || "")[0] || "";
    return (n + a).toUpperCase();
  };

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header del Paciente */}
      {paciente && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar con iniciales */}
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-semibold">
                {getInitials(paciente.nombre, paciente.apellido)}
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>DNI: {paciente.dni}</span>
                  <span>·</span>
                  <span>{paciente.edad} años</span>
                  <span>·</span>
                  <span>{paciente.genero}</span>
                </div>
                
                {consultaInicial && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Última visita:</span>{" "}
                    {consultaInicial.fecha
                      ? new Date(consultaInicial.fecha).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/panel/nutri/seguimientos/${pacienteId}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
              >
                + Añadir seguimiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar en notas
            </label>
            <input
              type="text"
              placeholder="Buscar en notas del paciente…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TODOS">Todos</option>
              <option value="SEGUIMIENTO">Seguimiento</option>
            </select>
          </div>

          {/* Orden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar
            </label>
            <button
              onClick={() => setOrdenAsc(!ordenAsc)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm hover:bg-gray-50 text-left flex items-center justify-between"
            >
              <span>{ordenAsc ? "Más antiguo" : "Más reciente"}</span>
              <span>{ordenAsc ? "↑" : "↓"}</span>
            </button>
          </div>
        </div>

        {/* Rango de fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => handlePresetFecha("HOY")}
              className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              Hoy
            </button>
            <button
              onClick={() => handlePresetFecha("7_DIAS")}
              className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              7 días
            </button>
            <button
              onClick={() => handlePresetFecha("30_DIAS")}
              className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              30 días
            </button>
            <button
              onClick={limpiarFiltros}
              className="px-3 py-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Listado de seguimientos */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de Seguimientos
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({seguimientosFiltrados.length} {seguimientosFiltrados.length === 1 ? "registro" : "registros"})
            </span>
          </h2>
        </div>

        {seguimientosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay seguimientos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay seguimientos para este paciente con estos filtros.
            </p>
            {(fechaDesde || fechaHasta || busqueda || tipoFiltro !== "TODOS") && (
              <button
                onClick={limpiarFiltros}
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {seguimientosFiltrados.map((seg, idx) => (
              <div
                key={seg.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleVerSeguimiento(seg)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        Seguimiento #{seguimientosFiltrados.length - idx}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {seg.tipo || "Seguimiento"}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-600">
                      {seg.fecha
                        ? new Date(seg.fecha).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Fecha no disponible"}
                    </div>

                    {seg.notas && (
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                        {seg.notas}
                      </p>
                    )}

                    {seg.respuestas && seg.respuestas.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {seg.respuestas.length} {seg.respuestas.length === 1 ? "registro" : "registros"}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerSeguimiento(seg);
                    }}
                    className="ml-4 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {modalOpen && selectedSeguimiento && (
        <SeguimientoModal
          seguimiento={selectedSeguimiento}
          paciente={paciente}
          onClose={() => {
            setModalOpen(false);
            setSelectedSeguimiento(null);
          }}
        />
      )}
    </div>
  );
}
