// src/containers/pages/nutricionista/DashboardNutri.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfDay, endOfDay, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  useGetTurnosNutricionistaQuery,
  useGetProfessionalSettingsQuery,
  useGetUbicacionesQuery,
  useGetTiposConsultaQuery,
  useGetAvailableSlotsQuery
} from '../../../features/agenda/agendaApiSlice';
import { useSelector } from 'react-redux';

const DashboardNutri = () => {
  const { user } = useSelector(state => state.auth);
  
  // Fecha de hoy en timezone de Argentina
  const hoy = useMemo(() => new Date(), []);
  const fechaFormateada = useMemo(() => {
    return format(hoy, "EEEE d 'de' MMMM, yyyy", { locale: es });
  }, [hoy]);

  // Rangos de fechas
  const ultimos7Dias = useMemo(() => ({
    fecha_inicio: format(startOfDay(subDays(hoy, 7)), "yyyy-MM-dd'T'HH:mm:ss"),
    fecha_fin: format(endOfDay(hoy), "yyyy-MM-dd'T'HH:mm:ss")
  }), [hoy]);

  const proximos7Dias = useMemo(() => ({
    fecha_inicio: format(startOfDay(hoy), "yyyy-MM-dd'T'HH:mm:ss"),
    fecha_fin: format(endOfDay(addDays(hoy, 7)), "yyyy-MM-dd'T'HH:mm:ss")
  }), [hoy]);

  const turnosHoy = useMemo(() => ({
    fecha_inicio: format(startOfDay(hoy), "yyyy-MM-dd'T'HH:mm:ss"),
    fecha_fin: format(endOfDay(hoy), "yyyy-MM-dd'T'HH:mm:ss")
  }), [hoy]);

  // Queries
  const { data: turnosRecientes = [] } = useGetTurnosNutricionistaQuery(ultimos7Dias);
  const { data: turnosProximos = [] } = useGetTurnosNutricionistaQuery(proximos7Dias);
  const { data: turnosDia = [] } = useGetTurnosNutricionistaQuery(turnosHoy);
  const { data: settings, isLoading: loadingSettings } = useGetProfessionalSettingsQuery();
  const { data: ubicaciones = [], isLoading: loadingUbicaciones } = useGetUbicacionesQuery();
  const { data: tiposConsulta = [], isLoading: loadingTipos } = useGetTiposConsultaQuery();

  // Calcular KPIs
  const kpis = useMemo(() => {
    const confirmados = turnosProximos.filter(t => t.state === 'CONFIRMADO').length;
    const noShow = turnosRecientes.filter(t => t.state === 'AUSENTE').length;
    const reprogramados = turnosRecientes.filter(t => t.state === 'RESCHEDULED').length;
    const cancelados = turnosRecientes.filter(t => t.state === 'CANCELADO').length;

    return { confirmados, noShow, reprogramados, cancelados };
  }, [turnosRecientes, turnosProximos]);

  // Filtrar y ordenar turnos de hoy
  const turnosDeHoyOrdenados = useMemo(() => {
    return [...turnosDia]
      .filter(t => !['CANCELADO', 'AUSENTE'].includes(t.state))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 8);
  }, [turnosDia]);

  // Alertas de configuración
  const alertas = useMemo(() => {
    const alerts = [];
    if (!loadingSettings && !settings) {
      alerts.push({
        tipo: 'settings',
        mensaje: 'No has configurado tu disponibilidad horaria',
        accion: 'Configurar ahora',
        link: '/panel/nutri/agenda/configuracion'
      });
    }
    if (!loadingUbicaciones && ubicaciones.length === 0) {
      alerts.push({
        tipo: 'ubicaciones',
        mensaje: 'No tienes ubicaciones de atención configuradas',
        accion: 'Agregar ubicación',
        link: '/panel/nutri/agenda/configuracion'
      });
    }
    if (!loadingTipos && tiposConsulta.length === 0) {
      alerts.push({
        tipo: 'tipos',
        mensaje: 'No has definido tipos de consulta',
        accion: 'Agregar tipo',
        link: '/panel/nutri/agenda/configuracion'
      });
    }
    return alerts;
  }, [settings, ubicaciones, tiposConsulta, loadingSettings, loadingUbicaciones, loadingTipos]);

  // Helpers para estado
  const getEstadoColor = (estado) => {
    const colores = {
      TENTATIVO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CONFIRMADO: 'bg-green-100 text-green-800 border-green-200',
      ATENDIDO: 'bg-blue-100 text-blue-800 border-blue-200',
      AUSENTE: 'bg-red-100 text-red-800 border-red-200',
      CANCELADO: 'bg-gray-100 text-gray-800 border-gray-200',
      RESCHEDULED: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      TENTATIVO: 'Pendiente',
      CONFIRMADO: 'Confirmado',
      ATENDIDO: 'Atendido',
      AUSENTE: 'Ausente',
      CANCELADO: 'Cancelado',
      RESCHEDULED: 'Reprogramado'
    };
    return textos[estado] || estado;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Nutricionista
        </h1>
        <p className="text-gray-600 capitalize">
          {fechaFormateada}
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/panel/nutri/agenda/turnos"
          className="flex items-center justify-center px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Ver agenda
        </Link>
        <Link
          to="/panel/nutri/agenda/configuracion"
          className="flex items-center justify-center px-6 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurar agenda
        </Link>
        <Link
          to="/panel/nutri/pacientes"
          className="flex items-center justify-center px-6 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Pacientes
        </Link>
      </div>

      {/* Alertas de configuración */}
      {alertas.length > 0 && (
        <div className="mb-8 space-y-3">
          {alertas.map((alerta, idx) => (
            <div key={idx} className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium text-amber-800">{alerta.mensaje}</p>
                </div>
                <Link
                  to={alerta.link}
                  className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  {alerta.accion}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Confirmados</p>
              <p className="text-3xl font-bold text-green-600">{kpis.confirmados}</p>
              <p className="text-xs text-gray-500 mt-1">Próximos 7 días</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">No-show</p>
              <p className="text-3xl font-bold text-red-600">{kpis.noShow}</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 días</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Reprogramados</p>
              <p className="text-3xl font-bold text-purple-600">{kpis.reprogramados}</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 días</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Cancelados</p>
              <p className="text-3xl font-bold text-gray-600">{kpis.cancelados}</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 días</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Agenda de hoy */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Agenda de hoy</h2>
          <Link
            to="/panel/nutri/agenda/turnos"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Ver todo →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {turnosDeHoyOrdenados.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">No tienes turnos programados para hoy</p>
            </div>
          ) : (
            turnosDeHoyOrdenados.map((turno) => (
              <div key={turno.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-600">
                            {format(new Date(turno.start_time), 'HH:mm')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(turno.end_time), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {turno.paciente_nombre} {turno.paciente_apellido}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">
                            {turno.tipo_consulta_display || 'Consulta'}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {turno.ubicacion_nombre || 'Sin ubicación'}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getEstadoColor(turno.state)}`}>
                        {getEstadoTexto(turno.state)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/panel/nutri/agenda/turnos`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardNutri;
