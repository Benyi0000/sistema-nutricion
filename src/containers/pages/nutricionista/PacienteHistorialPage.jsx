// src/containers/pages/nutricionista/PacienteHistorialPage.jsx

import React, { useEffect, useState } from 'react';
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
                      <p className="text-sm text-purple-700 mt-1">
                        {selectedConsulta.plantilla_snapshot.preguntas?.length || 0} preguntas configuradas
                      </p>
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

export default PacienteHistorialPage;
