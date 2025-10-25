// src/features/agenda/components/Nutricionista/UbicacionListEdit.jsx
import React, { useState } from 'react';
import {
  useGetUbicacionesQuery,
  useAddUbicacionMutation,
  useUpdateUbicacionMutation,
  useDeleteUbicacionMutation
} from '../../agendaApiSlice'; // Ajusta la ruta si es necesario

const UbicacionListEdit = () => {
  // Hook para obtener las ubicaciones
  const { data: ubicaciones, isLoading, isError, error } = useGetUbicacionesQuery();

  // Hooks para las mutaciones (devuelven un array con la función trigger y el estado)
  const [addUbicacion, { isLoading: isAdding }] = useAddUbicacionMutation();
  const [updateUbicacion, { isLoading: isUpdating }] = useUpdateUbicacionMutation();
  const [deleteUbicacion, { isLoading: isDeleting }] = useDeleteUbicacionMutation();

  const [newNombre, setNewNombre] = useState('');
  const [newDireccion, setNewDireccion] = useState('');
  // Podrías tener un estado para editar una ubicación existente

  const handleAdd = async () => {
    if (newNombre.trim() === '') return;
    try {
      // Llama a la mutación
      await addUbicacion({ nombre: newNombre, direccion: newDireccion }).unwrap();
      // Limpia el formulario (el refetch es automático gracias a invalidateTags)
      setNewNombre('');
      setNewDireccion('');
    } catch (err) {
      console.error('Failed to add ubicacion:', err);
      // Mostrar error al usuario
    }
  };

   const handleDelete = async (id) => {
     if (window.confirm('¿Estás seguro de eliminar esta ubicación?')) {
        try {
          await deleteUbicacion(id).unwrap();
          // El refetch es automático
        } catch (err) {
          console.error('Failed to delete ubicacion:', err);
          // Mostrar error al usuario
        }
     }
   };

   // --- Renderizado ---

  if (isLoading) return <div>Cargando ubicaciones...</div>;
  if (isError) return <div>Error al cargar ubicaciones: {error?.data?.detail || error.status}</div>;

  return (
    <div>
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Gestionar Ubicaciones</h3>

      {/* Formulario para añadir */}
      <div className="mb-4 p-4 border rounded shadow-sm">
        <h4 className="text-md font-medium mb-2">Añadir Nueva Ubicación</h4>
        <input
          type="text"
          placeholder="Nombre (Ej: Consultorio Centro)"
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          className="border p-2 rounded w-full mb-2"
          disabled={isAdding}
        />
        <input
          type="text"
          placeholder="Dirección (Opcional)"
          value={newDireccion}
          onChange={(e) => setNewDireccion(e.target.value)}
          className="border p-2 rounded w-full mb-2"
          disabled={isAdding}
        />
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isAdding ? 'Añadiendo...' : 'Añadir Ubicación'}
        </button>
      </div>

      {/* Lista de Ubicaciones */}
      <div>
        <h4 className="text-md font-medium mb-2">Ubicaciones Existentes</h4>
        {ubicaciones && ubicaciones.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {ubicaciones.map((ubicacion) => (
              <li key={ubicacion.id} className="flex justify-between items-center">
                <span>
                  <strong>{ubicacion.nombre}</strong>
                  {ubicacion.direccion && ` - ${ubicacion.direccion}`}
                </span>
                <div>
                  {/* Aquí podrías añadir botones/lógica para Editar */}
                  <button
                     onClick={() => handleDelete(ubicacion.id)}
                     disabled={isDeleting}
                     className="text-red-500 hover:text-red-700 ml-4 font-semibold disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay ubicaciones configuradas.</p>
        )}
      </div>
       {/* Indicador global de carga de mutaciones (opcional) */}
       {(isAdding || isUpdating || isDeleting) && <div className="mt-4 text-sm text-gray-500">Procesando...</div>}
    </div>
  );
};

export default UbicacionListEdit;