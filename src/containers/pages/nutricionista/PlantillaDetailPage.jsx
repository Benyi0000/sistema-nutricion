// src/containers/pages/nutricionista/PlantillaDetailPage.jsx

import React, { useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useGetPlantillaQuery } from '../../../features/plantillas/plantillasSlice';

const PlantillaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: plantilla, isLoading, error } = useGetPlantillaQuery(id);

  const normalizeCategorias = useMemo(() => {
    return (rawCats) => {
      if (!Array.isArray(rawCats)) return [];

      const vistos = new Set();
      const normalizadas = [];

      rawCats.forEach((cat, index) => {
        let categoriaNormalizada = null;

        if (typeof cat === 'string') {
          const id = String(cat).trim();
          if (!id) return;
          categoriaNormalizada = {
            id,
            nombre: cat,
            orden: index,
          };
        } else if (cat && typeof cat === 'object') {
          const nombreCrudo =
            cat.nombre ??
            cat.label ??
            cat.titulo ??
            cat.name ??
            cat.title ??
            '';

          const resolvedId =
            cat.id ??
            cat.temp_id ??
            cat.key ??
            nombreCrudo ??
            `cat-${index}`;

          const id = String(resolvedId).trim();
          if (!id) return;

          const nombre = String(nombreCrudo || id).trim() || id;

          categoriaNormalizada = {
            id,
            nombre,
            orden: cat.orden ?? index,
          };
        }

        if (categoriaNormalizada && !vistos.has(categoriaNormalizada.id)) {
          vistos.add(categoriaNormalizada.id);
          normalizadas.push(categoriaNormalizada);
        }
      });

      return normalizadas
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((cat, idx) => ({ ...cat, orden: idx }));
    };
  }, []);

  const inferCategoriasDesdePreguntas = useMemo(() => {
    return (preguntas = []) => {
      const map = new Map();

      preguntas.forEach((pc) => {
        const rawCategoria = pc?.config?.categoria;
        if (rawCategoria === null || rawCategoria === undefined || rawCategoria === '') return;

        const id = String(rawCategoria).trim();
        if (!id || map.has(id)) return;

        const nombre =
          pc?.config?.categoria_nombre ??
          pc?.config?.categoriaNombre ??
          pc?.config?.categoria_label ??
          pc?.config?.categoriaLabel ??
          id;

        map.set(id, {
          id,
          nombre: String(nombre || id).trim() || id,
          orden: map.size,
        });
      });

      return Array.from(map.values());
    };
  }, []);

  const categoriasInfo = useMemo(() => {
    if (!plantilla) return { categorias: [], categoriaMap: new Map() };

    let categorias = normalizeCategorias(plantilla.config?.categorias || []);

    if (categorias.length === 0) {
      const inferidas = normalizeCategorias(
        inferCategoriasDesdePreguntas(plantilla.preguntas_config)
      );
      if (inferidas.length > 0) {
        categorias = inferidas;
      }
    }

    const categoriaMap = new Map(categorias.map((cat) => [cat.id, cat]));
    return { categorias, categoriaMap };
  }, [plantilla, normalizeCategorias, inferCategoriasDesdePreguntas]);

  const preguntasAgrupadas = useMemo(() => {
    if (!plantilla) {
      return { sinCategoria: [], porCategoria: [] };
    }

    const ordenadas = Array.isArray(plantilla.preguntas_config)
      ? [...plantilla.preguntas_config].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      : [];

    const sinCategoria = [];
    const map = new Map();
    categoriasInfo.categorias.forEach((cat) => map.set(cat.id, []));

    let contador = 1;

    ordenadas.forEach((pc) => {
      const rawCategoria = pc?.config?.categoria;
      const catId = rawCategoria === null || rawCategoria === undefined || rawCategoria === ''
        ? null
        : String(rawCategoria).trim();

      const item = { ...pc, displayIndex: contador++ };

      if (catId && map.has(catId)) {
        map.get(catId).push(item);
      } else {
        sinCategoria.push(item);
      }
    });

    const porCategoria = categoriasInfo.categorias.map((cat) => ({
      cat,
      preguntas: map.get(cat.id) || [],
    }));

    return { sinCategoria, porCategoria };
  }, [plantilla, categoriasInfo]);

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
          <p className="text-red-800">Error al cargar la plantilla: {error.data?.detail || error.error}</p>
        </div>
      </div>
    );
  }

  const esSistema = plantilla.owner_info.tipo === 'sistema';
  const puedeEditar = !esSistema;
  const configEntries = Object.entries(plantilla.config || {}).filter(
    ([key]) => key !== 'categorias'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/panel/nutri/plantillas')}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a plantillas
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{plantilla.nombre}</h1>
              {plantilla.es_predeterminada && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Predeterminada
                </span>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                plantilla.tipo_consulta === 'INICIAL'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {plantilla.tipo_consulta === 'INICIAL' ? 'Inicial' : 'Seguimiento'}
              </span>
              {esSistema && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sistema
                </span>
              )}
            </div>
            {plantilla.descripcion && (
              <p className="text-gray-600 mt-2">{plantilla.descripcion}</p>
            )}
            <div className="mt-3 flex items-center text-sm text-gray-500">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>{plantilla.cantidad_preguntas} pregunta{plantilla.cantidad_preguntas !== 1 ? 's' : ''}</span>
              <span className="mx-2">•</span>
              <span>Creada: {new Date(plantilla.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            {puedeEditar && (
              <Link
                to={`/panel/nutri/plantillas/${id}/editar`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Configuración (si existe y excluyendo categorías) */}
      {configEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {configEntries.map(([key, value]) => (
              <div key={key} className="flex items-center">
                <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                  value ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {value ? (
                    <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="ml-3 text-sm text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Preguntas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Preguntas ({plantilla.preguntas_config?.length || 0})
          </h2>
        </div>

        {plantilla.preguntas_config && plantilla.preguntas_config.length > 0 ? (
          <div>
            {preguntasAgrupadas.porCategoria.map(({ cat, preguntas }) =>
              preguntas.length > 0 ? (
                <div key={cat.id} className="border-b border-gray-200">
                  <div className="px-6 pt-6 pb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700 uppercase tracking-wide">
                    <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-indigo-500"></span>
                    {cat.nombre}
                  </div>
                  <div className="divide-y divide-gray-200">
                    {preguntas.map((pc) => (
                      <div key={pc.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm">
                            {pc.displayIndex}
                          </div>
                          <div className="flex-1">
                            {renderPreguntaDetalle(pc, cat.nombre)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {preguntasAgrupadas.sinCategoria.length > 0 && (
              <div className="border-b border-gray-200">
                {categoriasInfo.categorias.length > 0 && (
                  <div className="px-6 pt-6 pb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Sin categoría
                  </div>
                )}
                <div className="divide-y divide-gray-200">
                  {preguntasAgrupadas.sinCategoria.map((pc) => (
                    <div key={pc.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {pc.displayIndex}
                        </div>
                        <div className="flex-1">
                          {renderPreguntaDetalle(pc)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2">Esta plantilla no tiene preguntas configuradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantillaDetailPage;

function renderPreguntaDetalle(pc, categoriaNombre) {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-medium text-gray-900">
            {pc.pregunta.texto}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {pc.pregunta.tipo}
            </span>
            {pc.pregunta.unidad && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {pc.pregunta.unidad}
              </span>
            )}
            {pc.pregunta.codigo && (
              <span className="text-xs text-gray-400">
                Código: {pc.pregunta.codigo}
              </span>
            )}
            {categoriaNombre && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                {categoriaNombre}
              </span>
            )}
          </div>

          {pc.pregunta.opciones && pc.pregunta.opciones.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Opciones:</p>
              <div className="flex flex-wrap gap-2">
                {pc.pregunta.opciones.map((opcion, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {typeof opcion === 'string' ? opcion : opcion.etiqueta || opcion.valor}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            {pc.requerido_en_plantilla && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Requerida
              </span>
            )}
            {!pc.visible && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    clipRule="evenodd"
                  />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                Oculta
              </span>
            )}
            {pc.pregunta.es_personalizada && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                Personalizada
              </span>
            )}
          </div>

          {pc.config && Object.keys(pc.config).length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Ver configuración adicional
              </summary>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(pc.config, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
