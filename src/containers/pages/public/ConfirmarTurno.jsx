// src/containers/pages/public/ConfirmarTurno.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Esta página recibe el token del MagicLink y confirma el turno
// URL: /confirmar-turno?token=UUID

export default function ConfirmarTurno() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState('loading'); // loading, success, error
  const [turno, setTurno] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('error');
      setErrorMsg('Token inválido o faltante');
      return;
    }

    // Llamar al endpoint de verificación
    const confirmarTurno = async () => {
      try {
        // TODO: Implementar llamada real
        // const response = await fetch('/api/public/agenda/turnos/verify/', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ token })
        // });
        // 
        // if (!response.ok) {
        //   throw new Error('Token inválido o expirado');
        // }
        // 
        // const data = await response.json();
        // setTurno(data);
        // setEstado('success');

        // Simulación por ahora
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock de respuesta
        setTurno({
          id: 123,
          start_time: '2025-10-31T14:00:00',
          end_time: '2025-10-31T15:00:00',
          ubicacion: { nombre: 'Consultorio Centro', direccion: 'Av. Córdoba 1234' },
          tipo_consulta: { tipo_display: 'Primera Consulta', duracion_min: 60 },
          nutricionista: { full_name: 'Lic. María García' },
          intake_answers: {
            nombre_completo: 'Juan Pérez',
            email: 'juan@ejemplo.com',
            telefono: '+54 9 11 1234-5678'
          }
        });
        setEstado('success');

      } catch (err) {
        setEstado('error');
        setErrorMsg(err.message || 'Error al confirmar el turno');
      }
    };

    confirmarTurno();
  }, [token]);

  // Pantalla de carga
  if (estado === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmando tu turno...</h2>
          <p className="text-gray-600">Por favor aguarda un momento</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (estado === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al confirmar</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <p className="text-sm text-gray-500 mb-6">
            El link puede haber expirado (10 minutos) o ya fue usado.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de éxito
  if (estado === 'success' && turno) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          {/* Encabezado de éxito */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Turno confirmado!</h2>
            <p className="text-gray-600">Tu reserva fue confirmada exitosamente</p>
          </div>

          {/* Detalles del turno */}
          <div className="bg-indigo-50 rounded-xl p-6 mb-6 space-y-4">
            <div>
              <p className="text-sm text-indigo-700 font-medium mb-1">Profesional</p>
              <p className="text-lg font-bold text-indigo-900">{turno.nutricionista?.full_name}</p>
            </div>

            <div className="border-t border-indigo-200 pt-4">
              <p className="text-sm text-indigo-700 font-medium mb-1">Fecha y hora</p>
              <p className="text-lg font-bold text-indigo-900">
                {format(new Date(turno.start_time), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <p className="text-lg font-bold text-indigo-900">
                {format(new Date(turno.start_time), "HH:mm")} - {format(new Date(turno.end_time), "HH:mm")}
              </p>
            </div>

            <div className="border-t border-indigo-200 pt-4">
              <p className="text-sm text-indigo-700 font-medium mb-1">Tipo de consulta</p>
              <p className="text-lg font-bold text-indigo-900">{turno.tipo_consulta?.tipo_display}</p>
              <p className="text-sm text-indigo-700">{turno.tipo_consulta?.duracion_min} minutos</p>
            </div>

            <div className="border-t border-indigo-200 pt-4">
              <p className="text-sm text-indigo-700 font-medium mb-1">Ubicación</p>
              <p className="text-lg font-bold text-indigo-900">{turno.ubicacion?.nombre}</p>
              <p className="text-sm text-indigo-700">{turno.ubicacion?.direccion}</p>
            </div>
          </div>

          {/* Datos del paciente */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Tus datos</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Nombre:</span> {turno.intake_answers?.nombre_completo}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> {turno.intake_answers?.email}
              </p>
              {turno.intake_answers?.telefono && (
                <p className="text-gray-700">
                  <span className="font-medium">Teléfono:</span> {turno.intake_answers?.telefono}
                </p>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Importante</p>
                <p>Te enviamos un email de confirmación con todos los detalles. Por favor revisá tu bandeja de entrada y spam.</p>
              </div>
            </div>
          </div>

          {/* Botón de cerrar */}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
