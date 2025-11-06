// src/containers/pages/public/LandingNutricionista.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Landing personalizado de cada nutricionista
// URL: /nutricionista/:nutricionistaId

export default function LandingNutricionista() {
  const { nutricionistaId } = useParams();
  const navigate = useNavigate();

  const [nutricionista, setNutricionista] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real del nutricionista
        const response = await fetch(`/api/public/nutricionistas/${nutricionistaId}/`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Nutricionista no encontrado o no tiene turnero público habilitado');
          } else {
            setError('Error al cargar información del nutricionista');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setNutricionista(data);

        // Fetch ubicaciones del nutricionista
        // TODO: Crear endpoint específico o incluir en el serializer
        setUbicaciones([
          { id: 1, nombre: 'Consultorio', direccion: 'Ver en reserva', is_virtual: false },
          { id: 2, nombre: 'Videoconsulta', direccion: 'Online', is_virtual: true }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error cargando nutricionista:', error);
        setError('Error al cargar información del nutricionista');
        setLoading(false);
      }
    };

    if (nutricionistaId) {
      fetchData();
    }
  }, [nutricionistaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/nutricionistas-disponibles')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ver todos los nutricionistas
          </button>
        </div>
      </div>
    );
  }

  if (!nutricionista) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nutricionista no encontrado</h2>
          <p className="text-gray-600 mb-6">El nutricionista que buscás no existe o no está disponible</p>
          <button
            onClick={() => navigate('/nutricionistas-disponibles')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ver nutricionistas disponibles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/nutricionistas-disponibles')}
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ver todos los nutricionistas
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="md:flex">
            {/* Foto */}
            <div className="md:w-1/3 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center p-12">
              {nutricionista.foto_perfil ? (
                <img
                  src={nutricionista.foto_perfil}
                  alt={nutricionista.full_name}
                  className="w-56 h-56 rounded-full object-cover border-4 border-white shadow-2xl"
                />
              ) : (
                <div className="w-56 h-56 rounded-full bg-white border-4 border-white shadow-2xl flex items-center justify-center">
                  <span className="text-8xl font-bold text-indigo-600">
                    {nutricionista.nombre?.[0]}{nutricionista.apellido?.[0]}
                  </span>
                </div>
              )}
            </div>
            
            {/* Información */}
            <div className="md:w-2/3 p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                {nutricionista.full_name}
              </h1>
              
              {nutricionista.especialidades && nutricionista.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {nutricionista.especialidades.map((esp, idx) => (
                    <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              {nutricionista.matricula && (
                <p className="text-gray-600 mb-4">
                  Matrícula: <span className="font-semibold">{nutricionista.matricula}</span>
                </p>
              )}

              {nutricionista.descripcion && (
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  {nutricionista.descripcion}
                </p>
              )}
              
              <button
                onClick={() => navigate(`/nutricionista/${nutricionistaId}/turno`)}
                className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
              >
                📅 Reservar turno online
              </button>
            </div>
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contacto */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              Contacto
            </h3>
            <div className="space-y-4 text-gray-700">
              {nutricionista.telefono && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">{nutricionista.telefono}</span>
                </div>
              )}
            </div>
          </div>

          {/* Modalidades de atención */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              Modalidades de atención
            </h3>
            <ul className="space-y-3">
              {ubicaciones.map((ub) => (
                <li key={ub.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {ub.is_virtual ? (
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{ub.nombre}</p>
                    <p className="text-sm text-gray-600">{ub.direccion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-indigo-100">
            Reservá tu turno online en solo 3 pasos
          </p>
          <button
            onClick={() => navigate(`/nutricionista/${nutricionistaId}/turno`)}
            className="bg-white text-indigo-600 px-10 py-4 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 font-bold text-lg shadow-xl"
          >
            Reservar ahora
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2025 Sistema de Nutrición. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
