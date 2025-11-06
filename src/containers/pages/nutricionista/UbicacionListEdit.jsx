// src/features/agenda/components/Nutricionista/UbicacionListEdit.jsx
import React, { useState } from 'react';
import {
  useGetUbicacionesQuery,
  useAddUbicacionMutation,
  useUpdateUbicacionMutation, // <-- Añadido para editar
  useDeleteUbicacionMutation
} from '../../agendaApiSlice'; // Ajusta la ruta si es necesario

// Componente simple para un formulario de edición/creación
const UbicacionForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [direccion, setDireccion] = useState(initialData?.direccion || '');
  const [link_mapa, setLinkMapa] = useState(initialData?.link_mapa || '');
  const [es_virtual, setEsVirtual] = useState(initialData?.es_virtual || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim() === '' && !es_virtual) return; // Nombre requerido si no es virtual
    onSubmit({
      nombre: es_virtual ? 'Virtual' : nombre, // Nombre por defecto si es virtual
      direccion,
      link_mapa,
      es_virtual,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="es_virtual" className="flex items-center space-x-2">
          <input
            id="es_virtual"
            name="es_virtual"
            type="checkbox"
            checked={es_virtual}
            onChange={(e) => setEsVirtual(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            disabled={isLoading}
          />
          <span className="text-sm font-medium text-gray-700">Es consulta virtual</span>
        </label>
      </div>

     {!es_virtual && ( // Mostrar nombre solo si NO es virtual
        <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isLoading}
            />
        </div>
     )}

      <div>
        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
          Dirección {es_virtual ? '(Opcional: link de la sala)' : '(Opcional)'}
        </label>
        <input
          type="text"
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="link_mapa" className="block text-sm font-medium text-gray-700">
          Link Mapa (Opcional)
        </label>
        <input
          type="url"
          id="link_mapa"
          value={link_mapa}
          onChange={(e) => setLinkMapa(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="https://"
          disabled={isLoading}
        />
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
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Añadir')}
        </button>
      </div>
    </form>
  );
};


const UbicacionListEdit = () => {
  const [isAdding, setIsAdding] = useState(false); // Estado para mostrar/ocultar form de añadir
  const [editingUbicacion, setEditingUbicacion] = useState(null); // Estado para guardar la ubicación que se edita

  // --- RTK Query Hooks ---
  const { data: ubicaciones = [], isLoading: isLoadingGet, isError, error } = useGetUbicacionesQuery();
  const [addUbicacion, { isLoading: isAddingMutation }] = useAddUbicacionMutation();
  const [updateUbicacion, { isLoading: isUpdatingMutation }] = useUpdateUbicacionMutation();
  const [deleteUbicacion, { isLoading: isDeletingMutation }] = useDeleteUbicacionMutation();
  // -----------------------

  const handleAddNew = async (formData) => {
    try {
      await addUbicacion(formData).unwrap();
      setIsAdding(false); // Ocultar formulario al éxito
    } catch (err) {
      console.error('Failed to add ubicacion:', err);
      alert(`Error al añadir: ${err.data?.detail || err.error || 'Error desconocido'}`);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingUbicacion) return;
    try {
      await updateUbicacion({ id: editingUbicacion.id, ...formData }).unwrap();
      setEditingUbicacion(null); // Ocultar formulario al éxito
    } catch (err) {
      console.error('Failed to update ubicacion:', err);
       alert(`Error al actualizar: ${err.data?.detail || err.error || 'Error desconocido'}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta ubicación? Los turnos asociados podrían verse afectados.')) {
      try {
        await deleteUbicacion(id).unwrap();
      } catch (err) {
        console.error('Failed to delete ubicacion:', err);
         alert(`Error al eliminar: ${err.data?.detail || err.error || 'Error desconocido'}`);
      }
    }
  };

   // --- Renderizado ---
  if (isLoadingGet) return <div className="text-center p-4">Cargando ubicaciones...</div>;
  if (isError) return <div className="text-center p-4 text-red-600">Error al cargar ubicaciones: {error?.data?.detail || error.status}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Gestionar Ubicaciones</h3>
        {!isAdding && !editingUbicacion && ( // Mostrar botón "Añadir" solo si no se está añadiendo ni editando
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Añadir Nueva
          </button>
        )}
      </div>

      {/* Formulario para añadir (condicional) */}
      {isAdding && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Nueva Ubicación</h4>
          <UbicacionForm
            onSubmit={handleAddNew}
            isLoading={isAddingMutation}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

       {/* Formulario para editar (condicional) */}
       {editingUbicacion && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Editando Ubicación</h4>
          <UbicacionForm
            initialData={editingUbicacion}
            onSubmit={handleUpdate}
            isLoading={isUpdatingMutation}
            onCancel={() => setEditingUbicacion(null)}
          />
        </div>
      )}

      {/* Lista de Ubicaciones */}
      {!isAdding && !editingUbicacion && ( // Mostrar lista solo si no se está añadiendo ni editando
        <div>
          {ubicaciones.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {ubicaciones.map((ubicacion) => (
                <li key={ubicacion.id} className="py-4 flex justify-between items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {ubicacion.es_virtual ? '📍 Virtual' : `📍 ${ubicacion.nombre}`}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {ubicacion.direccion || (ubicacion.es_virtual ? 'Sin link asociado' : 'Sin dirección')}
                    </p>
                     {ubicacion.link_mapa && !ubicacion.es_virtual && (
                         <a
                            href={ubicacion.link_mapa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline truncate"
                         >
                            Ver mapa
                         </a>
                     )}
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                     <button
                        onClick={() => setEditingUbicacion(ubicacion)}
                        disabled={isUpdatingMutation || isDeletingMutation}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
                     >
                       Editar
                     </button>
                    <button
                      onClick={() => handleDelete(ubicacion.id)}
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
            <p className="text-center text-gray-500 py-4">No hay ubicaciones configuradas.</p>
          )}
        </div>
      )}
       {/* Indicador global de carga de mutaciones (opcional) */}
       {(isAddingMutation || isUpdatingMutation || isDeletingMutation) && (
           <div className="mt-4 text-sm text-gray-500 text-center">Procesando...</div>
        )}
    </div>
  );
};

export default UbicacionListEdit;