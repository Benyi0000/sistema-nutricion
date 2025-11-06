// src/features/agenda/components/Nutricionista/TipoConsultaListEdit.jsx
import React, { useState } from 'react';
import {
  useGetTiposConsultaQuery,
  useAddTipoConsultaMutation,
  useUpdateTipoConsultaMutation,
  useDeleteTipoConsultaMutation,
} from '../../../features/agenda/agendaApiSlice';

// Componente de Formulario Reutilizable
const TipoConsultaForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  // Cambio: usamos 'tipo' en lugar de 'nombre'
  const [tipo, setTipo] = useState(initialData?.tipo || 'INICIAL');
  // Manejamos la duración en minutos directamente
  const [duracionMin, setDuracionMin] = useState(initialData?.duracion_min || 30);
  const [precio, setPrecio] = useState(initialData?.precio || '0.00');
  const [bufferBefore, setBufferBefore] = useState(initialData?.buffer_before_min || 0);
  const [bufferAfter, setBufferAfter] = useState(initialData?.buffer_after_min || 0);
  const [canalPorDefecto, setCanalPorDefecto] = useState(initialData?.canal_por_defecto || 'presencial');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      tipo,
      duracion_min: parseInt(duracionMin),
      precio: parseFloat(precio).toFixed(2),
      buffer_before_min: parseInt(bufferBefore),
      buffer_after_min: parseInt(bufferAfter),
      canal_por_defecto: canalPorDefecto,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tipoConsulta" className="block text-sm font-medium text-gray-700">
          Tipo de Consulta <span className="text-red-500">*</span>
        </label>
        <select
          id="tipoConsulta"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          disabled={isLoading || initialData} // Deshabilitar si estamos editando (no se puede cambiar el tipo)
        >
          <option value="INICIAL">Inicial</option>
          <option value="SEGUIMIENTO">Seguimiento</option>
        </select>
        {initialData && (
          <p className="text-xs text-gray-500 mt-1">
            El tipo no se puede cambiar una vez creado.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="duracionMin" className="block text-sm font-medium text-gray-700">
          Duración (minutos) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="duracionMin"
          value={duracionMin}
          onChange={(e) => setDuracionMin(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="1"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="precioTipoConsulta" className="block text-sm font-medium text-gray-700">
          Precio (ARS)
        </label>
        <input
          type="number"
          id="precioTipoConsulta"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="0.00"
          step="0.01"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="bufferBefore" className="block text-sm font-medium text-gray-700">
          ⏰ Buffer antes (minutos)
        </label>
        <input
          type="number"
          id="bufferBefore"
          value={bufferBefore}
          onChange={(e) => setBufferBefore(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="0"
          disabled={isLoading}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          🔹 Tiempo de preparación antes de la consulta (revisar historial, preparar consultorio)
        </p>
        <p className="text-xs text-indigo-600 font-medium mt-1">
          Este tiempo se bloquea automáticamente en el calendario
        </p>
      </div>

      <div>
        <label htmlFor="bufferAfter" className="block text-sm font-medium text-gray-700">
          📝 Buffer después (minutos)
        </label>
        <input
          type="number"
          id="bufferAfter"
          value={bufferAfter}
          onChange={(e) => setBufferAfter(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="0"
          disabled={isLoading}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          🔹 Tiempo después de la consulta (completar notas, limpiar/ventilar consultorio)
        </p>
        <p className="text-xs text-indigo-600 font-medium mt-1">
          Este tiempo se bloquea automáticamente en el calendario
        </p>
      </div>

      <div>        <p className="text-xs text-gray-500 mt-1">
          Tiempo de cierre después de la consulta
        </p>
      </div>

      <div>
        <label htmlFor="canalPorDefecto" className="block text-sm font-medium text-gray-700">
          Canal por defecto
        </label>
        <select
          id="canalPorDefecto"
          value={canalPorDefecto}
          onChange={(e) => setCanalPorDefecto(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isLoading}
        >
          <option value="presencial">Presencial</option>
          <option value="video">Video</option>
        </select>
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
          disabled={isLoading || duracionMin <= 0}
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
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {tipo.tipo_display || tipo.tipo}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Duración: {tipo.duracion_min} min - Precio: ${parseFloat(tipo.precio || 0).toFixed(2)} ARS
                    </p>
                    <p className="text-xs text-gray-400">
                      Buffer: {tipo.buffer_before_min}min antes / {tipo.buffer_after_min}min después - Canal: {tipo.canal_por_defecto}
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
            <p className="text-center text-gray-500 py-4">No hay tipos de consulta configurados. Configure INICIAL y/o SEGUIMIENTO.</p>
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