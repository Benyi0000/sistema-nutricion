// src/containers/pages/public/ListaNutricionistasPublica.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Esta página lista todos los nutricionistas con su turnero público
// URL: /nutricionistas-disponibles

export default function ListaNutricionistasPublica() {
  const [nutricionistas, setNutricionistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNutricionistas = async () => {
      try {
        const response = await fetch('/api/public/nutricionistas/');
        if (!response.ok) {
          throw new Error('Error al cargar nutricionistas');
        }
        const data = await response.json();
        setNutricionistas(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar nutricionistas disponibles');
        setLoading(false);
      }
    };
    
    fetchNutricionistas();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando nutricionistas...</p>
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
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Nutricionistas disponibles
          </h1>
          <p className="text-lg text-gray-600">
            Elegí tu nutricionista y reservá tu turno online
          </p>
        </div>
      </div>

      {/* Lista de nutricionistas */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nutricionistas.map((nutri) => (
            <div
              key={nutri.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
            >
              {/* Imagen */}
              <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                {nutri.foto_perfil ? (
                  <img
                    src={nutri.foto_perfil}
                    alt={nutri.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-4xl font-bold text-indigo-600">
                      {nutri.nombre?.[0]}{nutri.apellido?.[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {nutri.full_name}
                </h2>
                {nutri.especialidades && nutri.especialidades.length > 0 && (
                  <div className="mb-3">
                    {nutri.especialidades.map((esp, idx) => (
                      <span 
                        key={idx}
                        className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded mr-2 mb-1"
                      >
                        {esp}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{nutri.ubicaciones_count} {nutri.ubicaciones_count === 1 ? 'ubicación' : 'ubicaciones'}</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Disponible
                  </span>
                </div>

                {/* Botón CTA */}
                <Link
                  to={`/nutricionista/${nutri.id}`}
                  className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Ver perfil y reservar turno
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {nutricionistas.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay nutricionistas disponibles
            </h3>
            <p className="text-gray-600">
              Volvé más tarde para ver los profesionales disponibles
            </p>
          </div>
        )}
      </div>

      {/* Footer simple */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2025 Sistema de Nutrición. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
