// src/containers/pages/nutricionista/TurnosManagePage.jsx
import React, { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  useGetTurnosNutricionistaQuery, 
  useAprobarTurnoMutation,
  useCancelarTurnoMutation 
} from '../../../features/agenda/agendaApiSlice';

const TurnosManagePage = () => {
  // Estados para filtros
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedState, setSelectedState] = useState('ALL'); // ALL, TENTATIVO, CONFIRMADO, CANCELADO
  const [searchTerm, setSearchTerm] = useState('');

  // Calcular rango de fechas (mostrar +/- 7 días)
  const dateRange = useMemo(() => {
    const start = subDays(selectedDate, 7);
    const end = addDays(selectedDate, 7);
    return {
      fecha_inicio: format(startOfDay(start), "yyyy-MM-dd'T'HH:mm:ss"),
      fecha_fin: format(endOfDay(end), "yyyy-MM-dd'T'HH:mm:ss")
    };
  }, [selectedDate]);

  // Obtener turnos
  const { data: turnos = [], isLoading, refetch } = useGetTurnosNutricionistaQuery(dateRange);

  // Mutaciones
  const [aprobarTurno, { isLoading: aprobando }] = useAprobarTurnoMutation();
  const [cancelarTurno, { isLoading: cancelando }] = useCancelarTurnoMutation();

  // Filtrar turnos
  const filteredTurnos = useMemo(() => {
    let result = turnos;

    // Filtrar por estado
    if (selectedState !== 'ALL') {
      result = result.filter(t => t.state === selectedState);
    }

    // Filtrar por búsqueda (nombre del paciente)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.paciente_nombre?.toLowerCase().includes(term) ||
        t.paciente_apellido?.toLowerCase().includes(term)
      );
    }

    // Ordenar por fecha/hora (crear copia para evitar mutar array inmutable)
    return [...result].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [turnos, selectedState, searchTerm]);

  // Handlers
  const handleAprobar = async (turnoId) => {
    if (confirm('¿Confirmar este turno?')) {
      try {
        await aprobarTurno(turnoId).unwrap();
        refetch();
      } catch (error) {
        alert(error?.data?.error || 'Error al aprobar turno');
      }
    }
  };

  const handleCancelar = async (turnoId) => {
    const motivo = prompt('Motivo de cancelación (opcional):');
    if (motivo !== null) { // null significa que canceló el prompt
      try {
        await cancelarTurno({ id: turnoId, motivo }).unwrap();
        refetch();
      } catch (error) {
        alert(error?.data?.error || 'Error al cancelar turno');
      }
    }
  };

  // Función para renderizar el badge de estado
  const renderStateBadge = (state) => {
    const badges = {
      TENTATIVO: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      CONFIRMADO: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmado' },
      CANCELADO: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
      COMPLETADO: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completado' },
    };
    const badge = badges[state] || { bg: 'bg-gray-100', text: 'text-gray-800', label: state };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600 mt-1">Administra las solicitudes y turnos de tus pacientes</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar paciente
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o apellido..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtro de estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value="TENTATIVO">Pendientes</option>
                <option value="CONFIRMADO">Confirmados</option>
                <option value="CANCELADO">Cancelados</option>
                <option value="COMPLETADO">Completados</option>
              </select>
            </div>

            {/* Selector de fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha central
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ←
                </button>
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  →
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mostrando ±7 días desde esta fecha
              </p>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {turnos.filter(t => t.state === 'TENTATIVO').length}
              </div>
              <div className="text-xs text-gray-600">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {turnos.filter(t => t.state === 'CONFIRMADO').length}
              </div>
              <div className="text-xs text-gray-600">Confirmados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {turnos.filter(t => t.state === 'CANCELADO').length}
              </div>
              <div className="text-xs text-gray-600">Cancelados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {filteredTurnos.length}
              </div>
              <div className="text-xs text-gray-600">Filtrados</div>
            </div>
          </div>
        </div>

        {/* Lista de turnos */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando turnos...</p>
          </div>
        ) : filteredTurnos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 mb-2">No hay turnos para mostrar</p>
            <p className="text-sm text-gray-500">
              {searchTerm || selectedState !== 'ALL' 
                ? 'Intenta cambiar los filtros' 
                : 'Los turnos aparecerán aquí cuando los pacientes los soliciten'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTurnos.map((turno) => (
              <div
                key={turno.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-lg font-semibold text-indigo-600">
                            {turno.paciente_nombre?.[0]}{turno.paciente_apellido?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {turno.paciente_nombre} {turno.paciente_apellido}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {turno.tipo_consulta_display || 'Sin especificar'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        {/* Fecha y hora */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(turno.start_time), "dd 'de' MMMM, yyyy", { locale: es })}
                        </div>

                        {/* Horario */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {format(new Date(turno.start_time), 'HH:mm')} - {format(new Date(turno.end_time), 'HH:mm')}
                        </div>

                        {/* Ubicación */}
                        {turno.ubicacion_nombre && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {turno.ubicacion_nombre}
                          </div>
                        )}
                      </div>

                      {/* Notas del paciente */}
                      {turno.notas_paciente && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-xs font-medium text-gray-700 mb-1">Notas del paciente:</p>
                          <p className="text-sm text-gray-600">{turno.notas_paciente}</p>
                        </div>
                      )}
                    </div>

                    {/* Estado y acciones */}
                    <div className="flex flex-col items-end gap-3 ml-4">
                      {renderStateBadge(turno.state)}

                      {/* Acciones según estado */}
                      <div className="flex gap-2">
                        {turno.state === 'TENTATIVO' && (
                          <>
                            <button
                              onClick={() => handleAprobar(turno.id)}
                              disabled={aprobando}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✓ Confirmar
                            </button>
                            <button
                              onClick={() => handleCancelar(turno.id)}
                              disabled={cancelando}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✗ Rechazar
                            </button>
                          </>
                        )}
                        {turno.state === 'CONFIRMADO' && (
                          <button
                            onClick={() => handleCancelar(turno.id)}
                            disabled={cancelando}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnosManagePage;