// src/containers/pages/nutricionista/PacienteHistorialPage.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/client';

const PacienteHistorialPage = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConsulta, setSelectedConsulta] = useState(null);

  const snapshotAgrupado = useMemo(() => {
    if (!selectedConsulta?.plantilla_snapshot) return null;
    return agruparSnapshot(selectedConsulta.plantilla_snapshot);
  }, [selectedConsulta]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos del paciente
        const pacienteRes = await api.get(`/api/user/pacientes/${pacienteId}/`);
        setPaciente(pacienteRes.data);
        
        // Obtener consultas del paciente
        const consultasRes = await api.get(`/api/user/consultas/?paciente_id=${pacienteId}`);
        setConsultas(consultasRes.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.response?.data?.detail || 'Error al cargar el historial');
        setLoading(false);
      }
    };

    if (pacienteId) {
      fetchData();
    }
  }, [pacienteId]);

  const consultaInicial = consultas.find(c => c.tipo === 'INICIAL');
  const seguimientos = consultas.filter(c => c.tipo === 'SEGUIMIENTO');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/panel/nutri/pacientes')}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a pacientes
        </button>
        
        {paciente && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>DNI: {paciente.dni}</span>
                  {paciente.edad && <span>Edad: {paciente.edad} años</span>}
                  {paciente.telefono && <span>Tel: {paciente.telefono}</span>}
                  {paciente.email && <span>Email: {paciente.email}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total de consultas</p>
                <p className="text-3xl font-bold text-indigo-600">{consultas.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de consultas */}
        <div className="lg:col-span-1 space-y-4">
          {/* Consulta Inicial */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
              <h2 className="text-lg font-semibold text-indigo-900">Consulta Inicial</h2>
            </div>
            <div className="p-4">
              {consultaInicial ? (
                <button
                  onClick={() => setSelectedConsulta(consultaInicial)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedConsulta?.id === consultaInicial.id
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(consultaInicial.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                      {consultaInicial.metricas?.imc && (
                        <p className="text-sm text-gray-600">IMC: {consultaInicial.metricas.imc}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Sin consulta inicial</p>
              )}
            </div>
          </div>

          {/* Seguimientos */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              <h2 className="text-lg font-semibold text-green-900">
                Seguimientos ({seguimientos.length})
              </h2>
            </div>
            <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
              {seguimientos.length > 0 ? (
                seguimientos.map((seguimiento) => (
                  <button
                    key={seguimiento.id}
                    onClick={() => setSelectedConsulta(seguimiento)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedConsulta?.id === seguimiento.id
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(seguimiento.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                        {seguimiento.metricas?.imc && (
                          <p className="text-sm text-gray-600">IMC: {seguimiento.metricas.imc}</p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Sin seguimientos</p>
              )}
            </div>
          </div>
        </div>

        {/* Detalle de consulta seleccionada */}
        <div className="lg:col-span-2">
          {selectedConsulta ? (
            <div className="bg-white rounded-lg shadow">
              <div className={`px-6 py-4 border-b ${
                selectedConsulta.tipo === 'INICIAL' ? 'bg-indigo-50 border-indigo-100' : 'bg-green-50 border-green-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedConsulta.tipo === 'INICIAL' ? 'Consulta Inicial' : 'Seguimiento'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(selectedConsulta.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {selectedConsulta.plantilla_usada && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      📋 Con plantilla
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Métricas */}
                {selectedConsulta.metricas && Object.keys(selectedConsulta.metricas).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Métricas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(selectedConsulta.metricas).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 uppercase">{key}</p>
                          <p className="text-lg font-semibold text-gray-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Respuestas */}
                {selectedConsulta.respuestas && selectedConsulta.respuestas.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Respuestas</h3>
                    <div className="space-y-3">
                      {selectedConsulta.respuestas.map((respuesta, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700">{respuesta.pregunta}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <p className="text-base text-gray-900">
                              {respuesta.valor !== null && respuesta.valor !== undefined 
                                ? `${respuesta.valor} ${respuesta.unidad || ''}`
                                : '-'}
                            </p>
                            {respuesta.codigo && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {respuesta.codigo}
                              </span>
                            )}
                          </div>
                          {respuesta.observacion && (
                            <p className="mt-2 text-sm text-gray-600 italic">
                              Obs: {respuesta.observacion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas */}
                {selectedConsulta.notas && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notas</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedConsulta.notas}</p>
                    </div>
                  </div>
                )}

                {/* Plantilla usada */}
                {selectedConsulta.plantilla_snapshot && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Plantilla Utilizada</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="font-medium text-purple-900">
                        {selectedConsulta.plantilla_snapshot.nombre}
                      </p>
                      {selectedConsulta.plantilla_snapshot.descripcion && (
                        <p className="text-sm text-purple-700 mt-1">
                          {selectedConsulta.plantilla_snapshot.descripcion}
                        </p>
                      )}
                      <p className="text-xs text-purple-700 mt-2">
                        {selectedConsulta.plantilla_snapshot.preguntas?.length || 0} preguntas configuradas
                      </p>

                      {snapshotAgrupado && (
                        <div className="mt-4 space-y-5">
                          {snapshotAgrupado.porCategoria.map(({ cat, preguntas }) =>
                            preguntas.length > 0 ? (
                              <div key={cat.id} className="border border-purple-100 rounded-lg bg-white">
                                <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                  <span className="inline-flex w-2 h-2 rounded-full bg-purple-500"></span>
                                  {cat.nombre}
                                </div>
                                <div className="divide-y divide-purple-100">
                                  {preguntas.map((item) => (
                                    <div key={item._uuid} className="px-4 py-3">
                                      {renderSnapshotPreguntaCard(item, cat.nombre)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          )}

                          {snapshotAgrupado.sinCategoria.length > 0 && (
                            <div className="border border-purple-100 rounded-lg bg-white">
                              {snapshotAgrupado.categorias.length > 0 && (
                                <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  Sin categoría
                                </div>
                              )}
                              <div className="divide-y divide-purple-100">
                                {snapshotAgrupado.sinCategoria.map((item) => (
                                  <div key={item._uuid} className="px-4 py-3">
                                    {renderSnapshotPreguntaCard(item)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin consulta seleccionada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona una consulta o seguimiento para ver los detalles
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function normalizeSnapshotCategorias(rawCats) {
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
}

function inferCategoriasDesdePreguntasSnapshot(preguntas = []) {
  const map = new Map();

  preguntas.forEach((p) => {
    const rawCategoria = p?.categoria ?? p?.config?.categoria;
    if (rawCategoria === null || rawCategoria === undefined || rawCategoria === '') return;

    const id = String(rawCategoria).trim();
    if (!id || map.has(id)) return;

    const nombre =
      p?.config?.categoria_nombre ??
      p?.config?.categoriaNombre ??
      p?.config?.categoria_label ??
      p?.config?.categoriaLabel ??
      id;

    map.set(id, {
      id,
      nombre: String(nombre || id).trim() || id,
      orden: map.size,
    });
  });

  return Array.from(map.values());
}

function agruparSnapshot(snapshot) {
  const categoriasIniciales = normalizeSnapshotCategorias(snapshot?.categorias || []);
  let categorias = categoriasIniciales;

  if (categorias.length === 0) {
    const inferidas = normalizeSnapshotCategorias(
      inferCategoriasDesdePreguntasSnapshot(snapshot?.preguntas || [])
    );
    if (inferidas.length > 0) {
      categorias = inferidas;
    }
  }

  const map = new Map();
  categorias.forEach((cat) => map.set(cat.id, []));

  const ordenadas = Array.isArray(snapshot?.preguntas)
    ? [...snapshot.preguntas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    : [];

  const sinCategoria = [];
  let correlativo = 1;

  ordenadas.forEach((p, index) => {
    const rawCategoria = p?.categoria ?? p?.config?.categoria;
    const catId = rawCategoria === null || rawCategoria === undefined || rawCategoria === ''
      ? null
      : String(rawCategoria).trim();

    const item = {
      ...p,
      displayIndex: correlativo,
      _uuid: `${p?.pregunta?.id ?? 'preg'}-${correlativo}-${index}`,
    };
    correlativo += 1;

    if (catId && map.has(catId)) {
      map.get(catId).push(item);
    } else {
      sinCategoria.push(item);
    }
  });

  const porCategoria = categorias.map((cat) => ({
    cat,
    preguntas: map.get(cat.id) || [],
  }));

  return {
    categorias,
    sinCategoria,
    porCategoria,
  };
}

function renderSnapshotPreguntaCard(item, categoriaNombre) {
  const pregunta = item?.pregunta || {};
  const rawTitulo =
    pregunta.texto ??
    item.texto ??
    item.nombre ??
    item.label ??
    item.titulo ??
    '';
  const titulo = String(rawTitulo || 'Pregunta').trim() || 'Pregunta';
  const tipo = pregunta.tipo ?? item.tipo ?? null;
  const unidad = pregunta.unidad ?? item.unidad ?? null;
  const codigo = pregunta.codigo ?? item.codigo ?? null;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
        {item.displayIndex ?? item.orden ?? ''}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 flex-1">
            {titulo}
          </h4>
          {categoriaNombre && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-700">
              {categoriaNombre}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {tipo && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              {tipo}
            </span>
          )}
          {unidad && <span>Unidad: {unidad}</span>}
          {codigo && <span className="text-gray-400">Código: {codigo}</span>}
        </div>

        {Array.isArray(pregunta.opciones ?? item.opciones) && (pregunta.opciones ?? item.opciones)?.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Opciones</p>
            <div className="flex flex-wrap gap-1.5">
              {(pregunta.opciones ?? item.opciones).map((opcion, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {typeof opcion === 'string' ? opcion : opcion.etiqueta || opcion.valor}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          {item.requerido && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
              Requerida
            </span>
          )}
          {item.visible === false && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              Oculta
            </span>
          )}
        </div>

        {item.config && Object.keys(item.config).length > 0 && (
          <details className="mt-2">
            <summary className="text-[11px] text-gray-500 cursor-pointer hover:text-gray-700">
              Ver configuración
            </summary>
            <pre className="mt-2 text-[11px] bg-gray-50 p-2 rounded border border-gray-100 overflow-auto">
              {JSON.stringify(item.config, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default PacienteHistorialPage;
