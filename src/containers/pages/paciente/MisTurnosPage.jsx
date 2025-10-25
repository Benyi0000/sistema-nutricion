// src/containers/pages/paciente/MisTurnosPage.jsx
import React, { useState } from 'react';
import { useGetTurnosQuery, useCancelarTurnoMutation } from '../../../features/agenda/agendaApiSlice';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const MisTurnosPage = () => {
  const { data: turnos = [], isLoading, error } = useGetTurnosQuery();
  const [cancelarTurno, { isLoading: isCanceling }] = useCancelarTurnoMutation();
  const [turnoACancelar, setTurnoACancelar] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Función para obtener el color del badge según el estado
  const getEstadoColor = (estado) => {
    const colores = {
      TENTATIVO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      RESERVADO: 'bg-blue-100 text-blue-800 border-blue-200',
      CONFIRMADO: 'bg-green-100 text-green-800 border-green-200',
      ATENDIDO: 'bg-gray-100 text-gray-800 border-gray-200',
      AUSENTE: 'bg-red-100 text-red-800 border-red-200',
      CANCELADO: 'bg-red-100 text-red-800 border-red-200',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Función para obtener el texto en español del estado
  const getEstadoTexto = (estado) => {
    const textos = {
      TENTATIVO: 'Pendiente de aprobación',
      RESERVADO: 'Reservado',
      CONFIRMADO: 'Confirmado',
      ATENDIDO: 'Atendido',
      AUSENTE: 'Ausente',
      CANCELADO: 'Cancelado',
    };
    return textos[estado] || estado;
  };

  // Filtrar turnos según el estado seleccionado
  const turnosFiltrados = filtroEstado === 'TODOS' 
    ? turnos 
    : turnos.filter(t => t.state === filtroEstado);

  // Agrupar turnos en próximos y pasados
  const ahora = new Date();
  const turnosProximos = turnosFiltrados.filter(t => {
    if (!t.start_time) return false;
    const fechaTurno = parseISO(t.start_time);
    return fechaTurno >= ahora && !['CANCELADO', 'ATENDIDO', 'AUSENTE'].includes(t.state);
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const turnosPasados = turnosFiltrados.filter(t => {
    if (!t.start_time) return false;
    const fechaTurno = parseISO(t.start_time);
    return fechaTurno < ahora || ['CANCELADO', 'ATENDIDO', 'AUSENTE'].includes(t.state);
  }).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const handleCancelarClick = (turno) => {
    setTurnoACancelar(turno);
  };

  const handleConfirmarCancelacion = async () => {
    if (!turnoACancelar) return;
    
    try {
      await cancelarTurno(turnoACancelar.id).unwrap();
      alert('Turno cancelado exitosamente');
      setTurnoACancelar(null);
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      alert('Error al cancelar el turno. Por favor, intente nuevamente.');
    }
  };

  const TurnoCard = ({ turno }) => {
    const puedeCancelar = ['TENTATIVO', 'RESERVADO', 'CONFIRMADO'].includes(turno.state);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        {/* Header: Fecha y Estado */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {turno.start_time && format(parseISO(turno.start_time), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </h3>
            <p className="text-sm text-gray-600">
              {turno.start_time && format(parseISO(turno.start_time), 'HH:mm', { locale: es })} - 
              {turno.end_time && format(parseISO(turno.end_time), ' HH:mm', { locale: es })}
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getEstadoColor(turno.state)}`}>
            {getEstadoTexto(turno.state)}
          </span>
        </div>

        {/* Información del Nutricionista */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-700 font-medium">
              {turno.nutricionista?.full_name || 'Nutricionista'}
            </span>
          </div>

          {/* Tipo de Consulta */}
          {turno.tipo_consulta && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-gray-600">
                {turno.tipo_consulta.tipo_display || turno.tipo_consulta.tipo}
              </span>
            </div>
          )}

          {/* Ubicación */}
          {turno.ubicacion && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600">
                {turno.ubicacion.is_virtual ? '🖥️ Virtual' : `📍 ${turno.ubicacion.nombre}`}
              </span>
            </div>
          )}
        </div>

        {/* Notas del Paciente */}
        {turno.notas_paciente && (
          <div className="bg-gray-50 rounded p-2 mb-3">
            <p className="text-xs text-gray-500 mb-1">Tus notas:</p>
            <p className="text-sm text-gray-700">{turno.notas_paciente}</p>
          </div>
        )}

        {/* Botón de Cancelar */}
        {puedeCancelar && (
          <button
            onClick={() => handleCancelarClick(turno)}
            className="w-full mt-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
          >
            Cancelar turno
          </button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Mis Turnos</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Mis Turnos</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar los turnos. Por favor, intente nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Mis Turnos</h1>
        <p className="text-gray-600">Gestiona tus citas con tu nutricionista</p>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {['TODOS', 'TENTATIVO', 'CONFIRMADO', 'ATENDIDO', 'CANCELADO'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filtroEstado === estado
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {estado === 'TODOS' ? 'Todos' : getEstadoTexto(estado)}
            </button>
          ))}
        </div>
      </div>

      {/* Turnos Próximos */}
      {turnosProximos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Próximos turnos
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {turnosProximos.map((turno) => (
              <TurnoCard key={turno.id} turno={turno} />
            ))}
          </div>
        </div>
      )}

      {/* Turnos Pasados */}
      {turnosPasados.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historial
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {turnosPasados.map((turno) => (
              <TurnoCard key={turno.id} turno={turno} />
            ))}
          </div>
        </div>
      )}

      {/* Sin turnos */}
      {turnosProximos.length === 0 && turnosPasados.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filtroEstado === 'TODOS' ? 'No tienes turnos' : `No tienes turnos ${getEstadoTexto(filtroEstado).toLowerCase()}`}
          </h3>
          <p className="text-gray-600 mb-4">
            Solicita un nuevo turno con tu nutricionista
          </p>
          <a
            href="/paciente/turnos"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Solicitar turno
          </a>
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      {turnoACancelar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Confirmar cancelación?
            </h3>
            <p className="text-gray-600 mb-2">
              Estás por cancelar tu turno del:
            </p>
            <p className="font-medium text-gray-900 mb-4">
              {turnoACancelar.start_time && format(parseISO(turnoACancelar.start_time), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. Si necesitas reagendar, deberás solicitar un nuevo turno.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTurnoACancelar(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isCanceling}
              >
                No, volver
              </button>
              <button
                onClick={handleConfirmarCancelacion}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isCanceling}
              >
                {isCanceling ? 'Cancelando...' : 'Sí, cancelar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisTurnosPage;