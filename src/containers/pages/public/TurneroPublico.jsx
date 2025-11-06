// src/containers/pages/public/TurneroPublico.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { 
  useGetPublicSlotsQuery,
  useCreatePublicTurnoMutation 
} from '../../../features/agenda/publicAgendaApiSlice';

// Turnero público del nutricionista (wizard de 3 pasos)
// URL: /nutricionista/:nutricionistaId/turno

export default function TurneroPublico() {
  const { nutricionistaId } = useParams();
  const navigate = useNavigate();

  // Estados del wizard
  const [paso, setPaso] = useState(1);
  
  // Estado de selección
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);
  const [tipoConsultaSeleccionado, setTipoConsultaSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: ''
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Datos cargados
  const [nutricionista, setNutricionista] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [tiposConsulta, setTiposConsulta] = useState([]);

  // Mutation para crear turno
  const [createTurno] = useCreatePublicTurnoMutation();

  // Cargar datos del nutricionista
  useEffect(() => {
    const fetchNutricionista = async () => {
      try {
        const response = await fetch(`/api/public/nutricionistas/${nutricionistaId}/`);
        if (!response.ok) {
          throw new Error('Nutricionista no encontrado');
        }
        const data = await response.json();
        setNutricionista(data);
      } catch (err) {
        console.error('Error cargando nutricionista:', err);
        setError('Error al cargar información del nutricionista');
      }
    };

    if (nutricionistaId) {
      fetchNutricionista();
    }
  }, [nutricionistaId]);

  // Cargar ubicaciones del nutricionista
  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const response = await fetch(`/api/public/agenda/ubicaciones/?nutricionista=${nutricionistaId}`);
        if (!response.ok) {
          throw new Error('Error al cargar ubicaciones');
        }
        const data = await response.json();
        setUbicaciones(data);
      } catch (err) {
        console.error('Error cargando ubicaciones:', err);
        setError('Error al cargar ubicaciones');
      }
    };

    if (nutricionistaId) {
      fetchUbicaciones();
    }
  }, [nutricionistaId]);

  // Cargar tipos de consulta (solo Primera Consulta/INICIAL para públicos)
  useEffect(() => {
    const fetchTiposConsulta = async () => {
      try {
        const response = await fetch(`/api/public/agenda/tipos-consulta/?nutricionista=${nutricionistaId}`);
        if (!response.ok) {
          throw new Error('Error al cargar tipos de consulta');
        }
        const data = await response.json();
        setTiposConsulta(data);
      } catch (err) {
        console.error('Error cargando tipos de consulta:', err);
        setError('Error al cargar tipos de consulta');
      }
    };

    if (nutricionistaId) {
      fetchTiposConsulta();
    }
  }, [nutricionistaId]);

  // Query para slots (solo del día seleccionado)
  const rangoFechas = useMemo(() => {
    if (!fechaSeleccionada || !ubicacionSeleccionada || !tipoConsultaSeleccionado) return null;
    
    const inicio = startOfDay(fechaSeleccionada);
    const fin = startOfDay(fechaSeleccionada); // Mismo día
    
    return {
      nutricionistaId: Number(nutricionistaId),
      ubicacionId: ubicacionSeleccionada.id,
      tipoConsultaId: tipoConsultaSeleccionado.id,
      startDate: format(inicio, 'yyyy-MM-dd'),
      endDate: format(fin, 'yyyy-MM-dd')
    };
  }, [fechaSeleccionada, ubicacionSeleccionada, tipoConsultaSeleccionado, nutricionistaId]);

  const { data: slots = [], isLoading: loadingSlots, isFetching: fetchingSlots } = useGetPublicSlotsQuery(
    rangoFechas,
    { skip: !rangoFechas }
  );

  // Handlers
  const handleSeleccionarUbicacion = (ubicacion) => {
    setUbicacionSeleccionada(ubicacion);
    setSlotSeleccionado(null);
  };

  const handleSeleccionarTipoConsulta = (tipo) => {
    setTipoConsultaSeleccionado(tipo);
    setSlotSeleccionado(null);
  };

  const handleContinuarPaso1 = () => {
    if (!ubicacionSeleccionada || !tipoConsultaSeleccionado) {
      setError('Por favor selecciona ubicación y tipo de consulta');
      return;
    }
    setFechaSeleccionada(new Date());
    setPaso(2);
    setError(null);
  };

  const handleSeleccionarSlot = (slot) => {
    setSlotSeleccionado(slot);
  };

  const handleContinuarPaso2 = () => {
    if (!slotSeleccionado) {
      setError('Por favor selecciona un horario');
      return;
    }
    setPaso(3);
    setError(null);
  };

  const handleVolver = () => {
    if (paso === 2) {
      setPaso(1);
      setSlotSeleccionado(null);
    } else if (paso === 3) {
      setPaso(2);
    }
    setError(null);
  };

  const handleSubmitReserva = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre_completo || !formData.email) {
      setError('Nombre y email son obligatorios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const turnoData = {
        nutricionista: Number(nutricionistaId),
        ubicacion: ubicacionSeleccionada.id,
        tipo_consulta: tipoConsultaSeleccionado.id,
        start_time: slotSeleccionado.inicio,
        end_time: slotSeleccionado.fin,
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        telefono: formData.telefono || ''
      };
      
      console.log('📤 Enviando turno:', turnoData);
      await createTurno(turnoData).unwrap();
      
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.data?.error || 'Error al crear la reserva. Por favor intenta nuevamente.');
      setLoading(false);
    }
  };

  // Pantalla de éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva creada!</h2>
          <p className="text-gray-600 mb-6">
            Te enviamos un email a <span className="font-semibold">{formData.email}</span> con el link de confirmación.
          </p>
          <p className="text-sm text-amber-600 mb-6">
            ⏱️ Tenés 10 minutos para confirmar desde el link del email
          </p>
          <button
            onClick={() => navigate(`/nutricionista/${nutricionistaId}`)}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Wizard de reserva
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {nutricionista?.foto_perfil ? (
                <img 
                  src={nutricionista.foto_perfil} 
                  alt={nutricionista.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-indigo-600">
                    {nutricionista?.nombre?.[0]}{nutricionista?.apellido?.[0]}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{nutricionista?.full_name}</h1>
                <p className="text-sm text-gray-600">Reserva de turno</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/nutricionista/${nutricionistaId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Progreso */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  paso >= num 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {num}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  paso >= num ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {num === 1 && 'Selección'}
                  {num === 2 && 'Horario'}
                  {num === 3 && 'Datos'}
                </span>
              </div>
              {num < 3 && (
                <div className={`flex-1 h-1 mx-4 rounded ${
                  paso > num ? 'bg-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Contenido según paso */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* PASO 1: Selección de ubicación y tipo */}
          {paso === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Selecciona una ubicación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ubicaciones.map((ub) => (
                    <button
                      key={ub.id}
                      onClick={() => handleSeleccionarUbicacion(ub)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        ubicacionSeleccionada?.id === ub.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          ub.is_virtual ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {ub.is_virtual ? (
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{ub.nombre}</p>
                          <p className="text-sm text-gray-600">{ub.direccion}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tipo de consulta</h2>
                <div className="grid grid-cols-1 gap-4">
                  {tiposConsulta.map((tipo) => (
                    <button
                      key={tipo.id}
                      onClick={() => handleSeleccionarTipoConsulta(tipo)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        tipoConsultaSeleccionado?.id === tipo.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 mb-2">{tipo.tipo_display}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{tipo.duracion_min} min</span>
                        <span className="font-bold text-indigo-600">${tipo.precio}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleContinuarPaso1}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Continuar
              </button>
            </div>
          )}

          {/* PASO 2: Selección de horario con calendario */}
          {paso === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Paso 3: Selecciona día y horario</h2>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-900">
                  <span className="font-semibold">{tipoConsultaSeleccionado.tipo_display}</span> en <span className="font-semibold">{ubicacionSeleccionada.nombre}</span>
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Columna del Calendario */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <style>{`
                    .rdp {
                      --rdp-cell-size: 48px;
                      --rdp-accent-color: #4f46e5;
                      margin: 0;
                    }
                    .rdp-head_cell {
                      font-weight: 600;
                      font-size: 0.875rem;
                    }
                    .rdp-day_today {
                      font-weight: 800;
                      color: #4338ca;
                    }
                  `}</style>
                  <DayPicker
                    mode="single"
                    selected={fechaSeleccionada}
                    onSelect={setFechaSeleccionada}
                    locale={es}
                    fromDate={new Date()}
                    modifiersStyles={{
                      disabled: { opacity: 0.4, cursor: 'not-allowed' },
                    }}
                  />
                </div>

                {/* Columna de Horarios */}
                <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">
                    Horarios disponibles para el{' '}
                    {format(fechaSeleccionada, "eeee dd 'de' MMMM", { locale: es })}
                  </h3>

                  {(loadingSlots || fetchingSlots) ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Buscando horarios...</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-gray-500">No hay horarios disponibles para este día.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {slots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSeleccionarSlot(slot)}
                          className={`px-4 py-3 rounded-lg text-center font-medium transition-all ${
                            slotSeleccionado?.inicio === slot.inicio
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-500 text-white hover:bg-indigo-600'
                          }`}
                        >
                          {format(parseISO(slot.inicio), 'HH:mm')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleVolver}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Volver
                </button>
                <button
                  onClick={handleContinuarPaso2}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  disabled={!slotSeleccionado}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Datos personales */}
          {paso === 3 && (
            <form onSubmit={handleSubmitReserva} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Completá tus datos</h2>

              <div className="bg-indigo-50 p-4 rounded-lg space-y-1">
                <p className="text-sm text-indigo-900">
                  <span className="font-semibold">{tipoConsultaSeleccionado.tipo_display}</span>
                </p>
                <p className="text-sm text-indigo-900 capitalize">
                  {format(new Date(slotSeleccionado.inicio), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
                <p className="text-sm text-indigo-900">
                  {ubicacionSeleccionada.nombre}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="juan@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleVolver}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  disabled={loading}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
