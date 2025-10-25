// src/features/agenda/components/Nutricionista/BloqueoListEdit.jsx
import React, { useState } from 'react';
import {
  useGetBloqueosQuery,
  useAddBloqueoMutation,
  useUpdateBloqueoMutation,
  useDeleteBloqueoMutation,
  useGetUbicacionesQuery, // Necesitamos cargar ubicaciones
} from '../../agendaApiSlice'; // Ajusta la ruta

// Helper para formatear fecha/hora para input datetime-local (YYYY-MM-DDTHH:mm)
const formatDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    try {
        // Extraer YYYY-MM-DDTHH:mm de la cadena ISO (ej: 2024-10-26T10:00:00-03:00)
        return isoString.substring(0, 16);
    } catch (e) {
        return '';
    }
};

// Componente de Formulario Reutilizable
const BloqueoForm = ({ initialData, onSubmit, isLoading, onCancel, ubicaciones }) => {
  // Inicializar con la fecha/hora actual si es nuevo
  const nowLocal = formatDateTimeLocal(new Date().toISOString());
  
  const [ubicacion, setUbicacion] = useState(initialData?.ubicacion || '');
  const [start_time, setStartTime] = useState(formatDateTimeLocal(initialData?.start_time) || nowLocal);
  const [end_time, setEndTime] = useState(formatDateTimeLocal(initialData?.end_time) || nowLocal);
  const [motivo, setMotivo] = useState(initialData?.motivo || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!ubicacion) {
      setError('Debe seleccionar una ubicación.');
      return;
    }
    if (!start_time || !end_time) {
      setError('Las fechas/horas de inicio y fin son requeridas.');
      return;
    }
    
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('Formato de fecha/hora inválido.');
      return;
    }

    if (startDate >= endDate) {
      setError('La fecha/hora de fin debe ser posterior a la de inicio.');
      return;
    }
    
    if (motivo.trim() === '') {
      setError('El motivo es requerido.');
      return;
    }

    // Enviar en formato ISO-8601 (el backend espera DateTimeField)
    onSubmit({
      ubicacion: parseInt(ubicacion, 10),
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      motivo: motivo.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      {/* Ubicación */}
      <div>
        <label htmlFor="ubicacionBloqueo" className="block text-sm font-medium text-gray-700">
          Ubicación <span className="text-red-500">*</span>
        </label>
        <select
          id="ubicacionBloqueo"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          disabled={isLoading}
        >
          <option value="">-- Seleccione ubicación --</option>
          {ubicaciones?.map((ub) => (
            <option key={ub.id} value={ub.id}>
              {ub.nombre} {ub.is_virtual ? '(Virtual)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Motivo */}
      <div>
        <label htmlFor="motivoBloqueo" className="block text-sm font-medium text-gray-700">
          Motivo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="motivoBloqueo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          disabled={isLoading}
        />
      </div>

      {/* Fechas/Horas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="inicioBloqueo" className="block text-sm font-medium text-gray-700">
            Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="inicioBloqueo"
            value={start_time}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="finBloqueo" className="block text-sm font-medium text-gray-700">
            Fin <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="finBloqueo"
            value={end_time}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min={start_time || ''} // Fin debe ser >= Inicio
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : (initialData ? 'Actualizar Bloqueo' : 'Añadir Bloqueo')}
        </button>
      </div>
    </form>
  );
};


const BloqueoListEdit = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingBloqueo, setEditingBloqueo] = useState(null);

  // --- RTK Query Hooks ---
  const { data: ubicaciones = [], isLoading: isLoadingUbicaciones } = useGetUbicacionesQuery();
  
  // Ordenar por fecha de inicio descendente (más recientes primero)
  const { data: bloqueos = [], isLoading: isLoadingGet, isError, error } = useGetBloqueosQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => ({
      data: data ? [...data].sort((a, b) => new Date(b.start_time) - new Date(a.start_time)) : [],
      ...rest,
    }),
  });
  const [addBloqueo, { isLoading: isAddingMutation }] = useAddBloqueoMutation();
  const [updateBloqueo, { isLoading: isUpdatingMutation }] = useUpdateBloqueoMutation();
  const [deleteBloqueo, { isLoading: isDeletingMutation }] = useDeleteBloqueoMutation();
  // -----------------------

  const handleAddNew = async (formData) => {
    try {
      await addBloqueo(formData).unwrap();
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add bloqueo:', err);
       alert(`Error al añadir: ${err.data?.detail || err.error || 'Verifica que no haya solapamientos'}`);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingBloqueo) return;
    try {
      await updateBloqueo({ id: editingBloqueo.id, ...formData }).unwrap();
      setEditingBloqueo(null);
    } catch (err) {
      console.error('Failed to update bloqueo:', err);
      alert(`Error al actualizar: ${err.data?.detail || err.error || 'Verifica que no haya solapamientos'}`);
    }
  };

   const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este bloqueo de disponibilidad?')) {
      try {
        await deleteBloqueo(id).unwrap();
      } catch (err) {
        console.error('Failed to delete bloqueo:', err);
         alert(`Error al eliminar: ${err.data?.detail || err.error || 'Error desconocido'}`);
      }
    }
  };

   // Formatear fecha y hora para mostrar en la lista (más legible)
  const formatRangeForDisplay = (bloqueo) => {
    if (!bloqueo?.start_time || !bloqueo?.end_time) return 'Rango inválido';
    try {
        const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const optionsTime = { hour: '2-digit', minute: '2-digit' };
        const inicio = new Date(bloqueo.start_time);
        const fin = new Date(bloqueo.end_time);

        const inicioFecha = inicio.toLocaleDateString('es-AR', optionsDate);
        const inicioHora = inicio.toLocaleTimeString('es-AR', optionsTime);
        const finFecha = fin.toLocaleDateString('es-AR', optionsDate);
        const finHora = fin.toLocaleTimeString('es-AR', optionsTime);

        // Buscar el nombre de la ubicación
        const ubicacion = ubicaciones.find(u => u.id === bloqueo.ubicacion);
        const ubicacionNombre = ubicacion?.nombre || 'Ubicación desconocida';

        if (inicioFecha === finFecha) {
            return `📅 ${inicioFecha} de ${inicioHora} a ${finHora} hs • 📍 ${ubicacionNombre}`;
        } else {
            return `📅 Desde ${inicioFecha} ${inicioHora} hs hasta ${finFecha} ${finHora} hs • 📍 ${ubicacionNombre}`;
        }
    } catch(e) {
        return 'Fechas inválidas';
    }
  };


  // --- Renderizado ---
  if (isLoadingGet || isLoadingUbicaciones) return <div className="text-center p-4">Cargando bloqueos...</div>;
  if (isError) return <div className="text-center p-4 text-red-600">Error al cargar bloqueos: {error?.data?.detail || error.status}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Gestionar Bloqueos de Disponibilidad</h3>
        {!isAdding && !editingBloqueo && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Añadir Bloqueo
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Nuevo Bloqueo</h4>
          <BloqueoForm
            onSubmit={handleAddNew}
            isLoading={isAddingMutation}
            onCancel={() => setIsAdding(false)}
            ubicaciones={ubicaciones}
          />
        </div>
      )}

      {editingBloqueo && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Editando Bloqueo</h4>
          <BloqueoForm
            initialData={editingBloqueo}
            onSubmit={handleUpdate}
            isLoading={isUpdatingMutation}
            onCancel={() => setEditingBloqueo(null)}
            ubicaciones={ubicaciones}
          />
        </div>
      )}

      {!isAdding && !editingBloqueo && (
        <div>
          {bloqueos.length > 0 ? (
            <ul className="divide-y divide-gray-200 border rounded">
              {bloqueos.map((bloqueo) => (
                <li key={bloqueo.id} className="px-4 py-3 flex justify-between items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      🚫 {bloqueo.motivo}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {formatRangeForDisplay(bloqueo)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                     <button
                        onClick={() => setEditingBloqueo(bloqueo)}
                        disabled={isUpdatingMutation || isDeletingMutation}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
                     >
                       Editar
                     </button>
                    <button
                      onClick={() => handleDelete(bloqueo.id)}
                      disabled={isDeletingMutation || isUpdatingMutation}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No hay bloqueos configurados.</p>
          )}
        </div>
      )}

      {(isAddingMutation || isUpdatingMutation || isDeletingMutation) && (
        <div className="mt-4 text-sm text-gray-500 text-center">Procesando...</div>
      )}
    </div>
  );
};

export default BloqueoListEdit;