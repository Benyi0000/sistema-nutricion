// src/containers/pages/nutricionista/PlanesAlimentariosPage.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PlanesAlimentariosPage = () => {
  const [planes, setPlanes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planAEliminar, setPlanAEliminar] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mensaje, setMensaje] = useState(null); // Para mensajes de éxito/error
  const [planAAsignar, setPlanAAsignar] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [isAsignando, setIsAsignando] = useState(false);
  const [asignacionAEliminar, setAsignacionAEliminar] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    archivo: null,
  });

  // Cargar planes
  const fetchPlanes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/user/planes-alimentarios/');
      setPlanes(response.data || []);
    } catch (err) {
      console.error('Error al cargar planes:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al cargar los planes alimentarios';
      setError(errorMessage);
      setPlanes([]); // Asegurar que planes sea un array vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar pacientes
  const fetchPacientes = async () => {
    try {
      const response = await api.get('/api/user/pacientes/');
      setPacientes(response.data || []);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
    }
  };

  // Cargar asignaciones
  const fetchAsignaciones = async () => {
    try {
      const response = await api.get('/api/user/asignaciones-planes/');
      setAsignaciones(response.data || []);
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
    }
  };

  useEffect(() => {
    fetchPlanes();
    fetchPacientes();
    fetchAsignaciones();
  }, []);

  // Manejar cambio de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, archivo: file });
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      setMensaje({ tipo: 'error', texto: 'El título es obligatorio' });
      setTimeout(() => setMensaje(null), 5000);
      return;
    }

    if (!formData.archivo) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un archivo' });
      setTimeout(() => setMensaje(null), 5000);
      return;
    }

    try {
      setIsSubmitting(true);
      setMensaje(null); // Limpiar mensajes anteriores
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion || '');
      formDataToSend.append('archivo', formData.archivo);

      // Enviar FormData con configuración explícita para evitar Content-Type incorrecto
      await api.post('/api/user/planes-alimentarios/', formDataToSend, {
        headers: {
          // No establecer Content-Type - axios lo establecerá automáticamente con boundary
        },
        transformRequest: [], // Deshabilitar transformRequest para FormData
      });

      // Limpiar formulario
      setFormData({
        titulo: '',
        descripcion: '',
        archivo: null,
      });
      
      // Resetear input file
      const fileInput = document.getElementById('archivo-input');
      if (fileInput) fileInput.value = '';

      // Recargar lista
      await fetchPlanes();
      
      // Mostrar mensaje de éxito
      setMensaje({ tipo: 'success', texto: 'Plan alimentario subido exitosamente' });
      setTimeout(() => setMensaje(null), 5000);
    } catch (err) {
      console.error('Error al subir plan:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.response?.data?.archivo?.[0] || // Error específico del campo archivo
                          err.message || 
                          'Error al subir el plan alimentario';
      setMensaje({ tipo: 'error', texto: errorMessage });
      setTimeout(() => setMensaje(null), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar plan
  const handleDelete = async () => {
    if (!planAEliminar) return;
    
    try {
      setIsDeleting(true);
      setMensaje(null); // Limpiar mensajes anteriores
      await api.delete(`/api/user/planes-alimentarios/${planAEliminar.id}/`);
      await fetchPlanes();
      setPlanAEliminar(null);
      setMensaje({ tipo: 'success', texto: 'Plan alimentario eliminado exitosamente' });
      setTimeout(() => setMensaje(null), 5000);
    } catch (err) {
      console.error('Error al eliminar plan:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al eliminar el plan alimentario';
      setMensaje({ tipo: 'error', texto: errorMessage });
      setTimeout(() => setMensaje(null), 7000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Descargar archivo
  const handleDownload = (archivoUrl) => {
    window.open(archivoUrl, '_blank');
  };

  // Asignar plan a paciente
  const handleAsignarPlan = async (planId, pacienteId, notas = '') => {
    try {
      setIsAsignando(true);
      setMensaje(null);
      await api.post('/api/user/asignaciones-planes/', {
        plan: planId,
        paciente: pacienteId,
        notas: notas,
      });
      await fetchAsignaciones();
      setPlanAAsignar(null);
      setMensaje({ tipo: 'success', texto: 'Plan asignado al paciente exitosamente' });
      setTimeout(() => setMensaje(null), 5000);
    } catch (err) {
      console.error('Error al asignar plan:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al asignar el plan al paciente';
      setMensaje({ tipo: 'error', texto: errorMessage });
      setTimeout(() => setMensaje(null), 7000);
    } finally {
      setIsAsignando(false);
    }
  };

  // Desasignar plan
  const handleDesasignarPlan = async () => {
    if (!asignacionAEliminar) return;
    
    try {
      setIsDeleting(true);
      setMensaje(null);
      await api.delete(`/api/user/asignaciones-planes/${asignacionAEliminar.id}/`);
      await fetchAsignaciones();
      setAsignacionAEliminar(null);
      setMensaje({ tipo: 'success', texto: 'Plan desasignado exitosamente' });
      setTimeout(() => setMensaje(null), 5000);
    } catch (err) {
      console.error('Error al desasignar plan:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al desasignar el plan';
      setMensaje({ tipo: 'error', texto: errorMessage });
      setTimeout(() => setMensaje(null), 7000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Obtener asignaciones de un plan
  const getAsignacionesPlan = (planId) => {
    return asignaciones.filter(a => a.plan === planId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Planes Alimentarios</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestiona tus planes alimentarios. Sube archivos en cualquier formato (PDF, DOCX, XLSX, imágenes, etc.)
        </p>
      </div>

      {/* Mensaje de éxito/error */}
      {mensaje && (
        <div className={`mb-6 rounded-lg p-4 ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {mensaje.tipo === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className="font-medium">{mensaje.texto}</p>
            </div>
            <button
              onClick={() => setMensaje(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Formulario de subida */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subir Nuevo Plan Alimentario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Ej: Plan para diabetes tipo 2"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Descripción del plan alimentario..."
            />
          </div>

          <div>
            <label htmlFor="archivo-input" className="block text-sm font-medium text-gray-700 mb-1">
              Archivo <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="archivo-input"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {formData.archivo && (
              <p className="mt-2 text-sm text-gray-600">
                Archivo seleccionado: <strong>{formData.archivo.name}</strong> ({(formData.archivo.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Subir Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de planes */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Planes Alimentarios</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {planes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes planes alimentarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza subiendo tu primer plan alimentario usando el formulario de arriba.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {planes.map((plan) => (
                <li key={plan.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {plan.titulo}
                        </h3>
                      </div>
                      {plan.descripcion && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {plan.descripcion}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          Creado el {format(new Date(plan.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </div>
                      
                      {/* Asignaciones del plan */}
                      {getAsignacionesPlan(plan.id).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Asignado a:</p>
                          <div className="flex flex-wrap gap-2">
                            {getAsignacionesPlan(plan.id).map((asignacion) => (
                              <span
                                key={asignacion.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {asignacion.paciente_nombre}
                                <button
                                  onClick={() => setAsignacionAEliminar(asignacion)}
                                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                                  title="Desasignar"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => setPlanAAsignar(plan)}
                        className="inline-flex items-center px-3 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Asignar a paciente"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Asignar
                      </button>
                      {plan.archivo_url && (
                        <button
                          onClick={() => handleDownload(plan.archivo_url)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          title="Descargar/Ver archivo"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Ver/Descargar
                        </button>
                      )}
                      <button
                        onClick={() => setPlanAEliminar(plan)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modal Eliminar */}
      {planAEliminar && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => setPlanAEliminar(null)}
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
                    Eliminar Plan Alimentario
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar el plan "<strong>{planAEliminar.titulo}</strong>"?
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
                  onClick={() => setPlanAEliminar(null)}
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

      {/* Modal Asignar Plan */}
      {planAAsignar && (
        <ModalAsignarPlan
          plan={planAAsignar}
          pacientes={pacientes}
          asignaciones={asignaciones}
          onAsignar={handleAsignarPlan}
          onClose={() => setPlanAAsignar(null)}
          isAsignando={isAsignando}
        />
      )}

      {/* Modal Desasignar */}
      {asignacionAEliminar && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => setAsignacionAEliminar(null)}
            />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Desasignar Plan
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas desasignar el plan "<strong>{asignacionAEliminar.plan_titulo}</strong>" del paciente "<strong>{asignacionAEliminar.paciente_nombre}</strong>"?
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDesasignarPlan}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Desasignando...' : 'Desasignar'}
                </button>
                <button
                  type="button"
                  onClick={() => setAsignacionAEliminar(null)}
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
    </div>
  );
};

// Componente Modal para Asignar Plan
const ModalAsignarPlan = ({ plan, pacientes, asignaciones, onAsignar, onClose, isAsignando }) => {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  const [notas, setNotas] = useState('');

  // Filtrar pacientes que ya tienen este plan asignado
  const pacientesDisponibles = pacientes.filter(p => {
    return !asignaciones.some(a => a.plan === plan.id && a.paciente === p.id);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pacienteSeleccionado) {
      return;
    }
    onAsignar(plan.id, parseInt(pacienteSeleccionado), notas);
  };

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Asignar Plan a Paciente
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Plan: <strong>{plan.titulo}</strong>
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
            <div className="mb-4">
              <label htmlFor="paciente-select" className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Paciente <span className="text-red-500">*</span>
              </label>
              <select
                id="paciente-select"
                value={pacienteSeleccionado}
                onChange={(e) => setPacienteSeleccionado(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">-- Seleccione un paciente --</option>
                {pacientesDisponibles.length === 0 ? (
                  <option disabled>Todos los pacientes ya tienen este plan asignado</option>
                ) : (
                  pacientesDisponibles.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nombre} {paciente.apellido} (DNI: {paciente.dni})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="notas-asignacion" className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                id="notas-asignacion"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Notas adicionales sobre esta asignación..."
              />
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={isAsignando || !pacienteSeleccionado || pacientesDisponibles.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {isAsignando ? 'Asignando...' : 'Asignar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isAsignando}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlanesAlimentariosPage;

