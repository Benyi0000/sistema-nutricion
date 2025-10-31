// src/containers/pages/nutricionista/PlantillasPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetPlantillasQuery,
  useDeletePlantillaMutation,
  useDuplicarPlantillaMutation,
} from '../../../features/plantillas/plantillasSlice';

const PlantillasPage = () => {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('true');
  const [plantillaAEliminar, setPlantillaAEliminar] = useState(null);
  const [plantillaADuplicar, setPlantillaADuplicar] = useState(null);
  const [nombreDuplicado, setNombreDuplicado] = useState('');

  const { data: plantillas, isLoading, error, refetch } = useGetPlantillasQuery({
    tipo_consulta: filtroTipo || undefined,
    activo: filtroActivo || undefined,
  });

  const [deletePlantilla, { isLoading: isDeleting }] = useDeletePlantillaMutation();
  const [duplicarPlantilla, { isLoading: isDuplicating }] = useDuplicarPlantillaMutation();

  const handleDelete = async () => {
    if (!plantillaAEliminar) return;
    try {
      await deletePlantilla(plantillaAEliminar.id).unwrap();
      await refetch();
      setPlantillaAEliminar(null);
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
      alert(err.data?.detail || 'Error al eliminar la plantilla');
    }
  };

  const handleDuplicar = async () => {
    if (!plantillaADuplicar) return;
    try {
      await duplicarPlantilla({
        id: plantillaADuplicar.id,
        nuevo_nombre: nombreDuplicado || `${plantillaADuplicar.nombre} (copia)`,
      }).unwrap();
      setPlantillaADuplicar(null);
      setNombreDuplicado('');
    } catch (err) {
      console.error('Error al duplicar plantilla:', err);
      alert(err.data?.detail || 'Error al duplicar la plantilla');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar plantillas: {error.data?.detail || error.error}</p>
        </div>
      </div>
    );
  }

  const plantillasSistema = plantillas?.filter((p) => p.owner_info.tipo === 'sistema') || [];
  const plantillasPropias = plantillas?.filter((p) => p.owner_info.tipo === 'nutricionista') || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plantillas de Consulta</h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestiona plantillas reutilizables de preguntas para tus consultas
            </p>
          </div>
          <Link
            to="/panel/nutri/plantillas/crear"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Plantilla
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Consulta
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="INICIAL">Inicial</option>
              <option value="SEGUIMIENTO">Seguimiento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plantillas del Sistema */}
      {plantillasSistema.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Plantillas del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plantillasSistema.map((plantilla) => (
              <PlantillaCard
                key={plantilla.id}
                plantilla={plantilla}
                esSistema={true}
                onDuplicar={() => {
                  setPlantillaADuplicar(plantilla);
                  setNombreDuplicado('');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Plantillas Propias */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Mis Plantillas
        </h2>
        {plantillasPropias.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes plantillas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva plantilla o duplicando una del sistema.
            </p>
            <div className="mt-6">
              <Link
                to="/panel/nutri/plantillas/crear"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Primera Plantilla
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plantillasPropias.map((plantilla) => (
              <PlantillaCard
                key={plantilla.id}
                plantilla={plantilla}
                esSistema={false}
                onDuplicar={() => {
                  setPlantillaADuplicar(plantilla);
                  setNombreDuplicado('');
                }}
                onEliminar={() => setPlantillaAEliminar(plantilla)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Eliminar */}
      {plantillaAEliminar && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => setPlantillaAEliminar(null)}
            />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Eliminar Plantilla
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar la plantilla "<strong>{plantillaAEliminar.nombre}</strong>"?
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  type="button"
                  onClick={() => setPlantillaAEliminar(null)}
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Duplicar */}
      {plantillaADuplicar && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => setPlantillaADuplicar(null)}
            />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Duplicar Plantilla
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Se creará una copia de "<strong>{plantillaADuplicar.nombre}</strong>" con todas sus preguntas.
                    </p>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="nombre-duplicado" className="block text-sm font-medium text-gray-700 text-left">
                      Nombre de la nueva plantilla
                    </label>
                    <input
                      type="text"
                      id="nombre-duplicado"
                      value={nombreDuplicado}
                      onChange={(e) => setNombreDuplicado(e.target.value)}
                      placeholder={`${plantillaADuplicar.nombre} (copia)`}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleDuplicar}
                  disabled={isDuplicating}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                </button>
                <button
                  type="button"
                  onClick={() => setPlantillaADuplicar(null)}
                  disabled={isDuplicating}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Card de Plantilla
const PlantillaCard = ({ plantilla, esSistema, onDuplicar, onEliminar }) => {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        {/* Header con tipo */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {plantilla.es_predeterminada && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Predeterminada
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                plantilla.tipo_consulta === 'INICIAL'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {plantilla.tipo_consulta === 'INICIAL' ? 'Inicial' : 'Seguimiento'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {plantilla.nombre}
            </h3>
            {esSistema && (
              <p className="text-xs text-gray-500 mt-1">Sistema</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        {plantilla.descripcion && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {plantilla.descripcion}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>{plantilla.cantidad_preguntas} pregunta{plantilla.cantidad_preguntas !== 1 ? 's' : ''}</span>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Link
            to={`/panel/nutri/plantillas/${plantilla.id}`}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver
          </Link>
          <button
            onClick={onDuplicar}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicar
          </button>
          {!esSistema && (
            <>
              <Link
                to={`/panel/nutri/plantillas/${plantilla.id}/editar`}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Editar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              <button
                onClick={onEliminar}
                className="inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantillasPage;
