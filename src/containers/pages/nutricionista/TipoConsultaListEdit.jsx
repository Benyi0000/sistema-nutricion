// src/features/agenda/components/Nutricionista/TipoConsultaListEdit.jsx
import React, { useState } from 'react';
import {
  useGetTiposConsultaQuery,
  useAddTipoConsultaMutation,
  useUpdateTipoConsultaMutation,
  useDeleteTipoConsultaMutation,
} from '../../../features/agenda/agendaApiSlice';

// Helper para convertir "HH:MM:SS" a minutos y viceversa
const durationToMinutes = (durationStr) => {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const parts = durationStr.split(':');
  if (parts.length === 3) {
    const [hours, minutes] = parts.map(Number);
    return hours * 60 + minutes;
  }
  return 0; // O manejar otros formatos si es necesario
};

const minutesToDuration = (minutes) => {
  if (minutes === null || minutes === undefined || minutes < 0) return '00:00:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // Asegura el formato HH:MM:SS
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
};

// Componente de Formulario Reutilizable
const TipoConsultaForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  // Manejamos la duración en minutos internamente para el input number
  const [duracionMinutos, setDuracionMinutos] = useState(
    initialData ? durationToMinutes(initialData.duracion_predeterminada) : 30
  );
  const [precio, setPrecio] = useState(initialData?.precio || '0.00');
  const [predeterminada, setPredeterminada] = useState(initialData?.predeterminada || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim() === '') return; // Nombre es requerido
    onSubmit({
      nombre,
      // Convertimos los minutos de vuelta a formato "HH:MM:SS" antes de enviar
      duracion_predeterminada: minutesToDuration(duracionMinutos),
      precio: parseFloat(precio).toFixed(2), // Asegurar formato decimal
      predeterminada,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nombreTipoConsulta" className="block text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nombreTipoConsulta"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="duracionMinutos" className="block text-sm font-medium text-gray-700">
          Duración (minutos) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="duracionMinutos"
          value={duracionMinutos}
          onChange={(e) => setDuracionMinutos(Math.max(0, parseInt(e.target.value, 10)))} // Evitar negativos
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="1" // Duración mínima de 1 minuto
          required
          disabled={isLoading}
        />
      </div>

       <div>
        <label htmlFor="precioTipoConsulta" className="block text-sm font-medium text-gray-700">
          Precio (ARS) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="precioTipoConsulta"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="0.00"
          step="0.01" // Para permitir decimales
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="predeterminadaTipoConsulta" className="flex items-center space-x-2">
          <input
            id="predeterminadaTipoConsulta"
            name="predeterminadaTipoConsulta"
            type="checkbox"
            checked={predeterminada}
            onChange={(e) => setPredeterminada(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            disabled={isLoading}
          />
          <span className="text-sm font-medium text-gray-700">Marcar como predeterminada</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
            Solo un tipo de consulta puede ser predeterminado. Al marcar este, se desmarcará el anterior. (La API debería manejar esto)
        </p>
      </div>

      <div className="flex justify-end space-x-3">
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
          disabled={isLoading || !nombre || duracionMinutos <= 0 || precio < 0} // Validación básica
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Añadir')}
        </button>
      </div>
    </form>
  );
};


const TipoConsultaListEdit = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTipoConsulta, setEditingTipoConsulta] = useState(null);

  // --- RTK Query Hooks ---
  const { data: tiposConsulta = [], isLoading: isLoadingGet, isError, error } = useGetTiposConsultaQuery();
  const [addTipoConsulta, { isLoading: isAddingMutation }] = useAddTipoConsultaMutation();
  const [updateTipoConsulta, { isLoading: isUpdatingMutation }] = useUpdateTipoConsultaMutation();
  const [deleteTipoConsulta, { isLoading: isDeletingMutation }] = useDeleteTipoConsultaMutation();
  // -----------------------

  const handleAddNew = async (formData) => {
    try {
      await addTipoConsulta(formData).unwrap();
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add tipo consulta:', err);
      alert(`Error al añadir: ${err.data?.detail || err.error || 'Error desconocido'}`);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingTipoConsulta) return;
    try {
      await updateTipoConsulta({ id: editingTipoConsulta.id, ...formData }).unwrap();
      setEditingTipoConsulta(null);
    } catch (err) {
      console.error('Failed to update tipo consulta:', err);
      alert(`Error al actualizar: ${err.data?.detail || err.error || 'Error desconocido'}`);
    }
  };

   const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este tipo de consulta? Los turnos asociados podrían verse afectados.')) {
      try {
        await deleteTipoConsulta(id).unwrap();
      } catch (err) {
        console.error('Failed to delete tipo consulta:', err);
        alert(`Error al eliminar: ${err.data?.detail || err.error || 'Error desconocido'}`);
      }
    }
  };

  // --- Renderizado ---
  if (isLoadingGet) return <div className="text-center p-4">Cargando tipos de consulta...</div>;
  if (isError) return <div className="text-center p-4 text-red-600">Error al cargar tipos de consulta: {error?.data?.detail || error.status}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Gestionar Tipos de Consulta</h3>
        {!isAdding && !editingTipoConsulta && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Añadir Nuevo
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Nuevo Tipo de Consulta</h4>
          <TipoConsultaForm
            onSubmit={handleAddNew}
            isLoading={isAddingMutation}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {editingTipoConsulta && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Editando Tipo de Consulta</h4>
          <TipoConsultaForm
            initialData={editingTipoConsulta}
            onSubmit={handleUpdate}
            isLoading={isUpdatingMutation}
            onCancel={() => setEditingTipoConsulta(null)}
          />
        </div>
      )}

      {!isAdding && !editingTipoConsulta && (
        <div>
          {tiposConsulta.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {tiposConsulta.map((tipo) => (
                <li key={tipo.id} className="py-4 flex justify-between items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-600 truncate flex items-center">
                      {tipo.nombre}
                      {tipo.predeterminada && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Predeterminada
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Duración: {durationToMinutes(tipo.duracion_predeterminada)} min - Precio: ${parseFloat(tipo.precio).toFixed(2)} ARS
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                     <button
                        onClick={() => setEditingTipoConsulta(tipo)}
                        disabled={isUpdatingMutation || isDeletingMutation}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
                     >
                       Editar
                     </button>
                    <button
                      onClick={() => handleDelete(tipo.id)}
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
            <p className="text-center text-gray-500 py-4">No hay tipos de consulta configurados.</p>
          )}
        </div>
      )}

      {(isAddingMutation || isUpdatingMutation || isDeletingMutation) && (
        <div className="mt-4 text-sm text-gray-500 text-center">Procesando...</div>
      )}
    </div>
  );
};

export default TipoConsultaListEdit;