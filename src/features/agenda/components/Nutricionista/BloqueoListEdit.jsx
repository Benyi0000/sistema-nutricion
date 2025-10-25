// src/features/agenda/components/Nutricionista/BloqueoListEdit.jsx
import React, { useState } from 'react';
import {
  useGetBloqueosQuery,
  useAddBloqueoMutation,
  useUpdateBloqueoMutation,
  useDeleteBloqueoMutation,
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

// Helper para convertir fecha/hora local a ISO string con offset UTC
// (Necesario porque el backend espera DateTimeRangeField con TimeZone)
const formatToISOWithOffset = (localDateTimeString) => {
    if (!localDateTimeString) return null;
    try {
        const date = new Date(localDateTimeString);
        if (isNaN(date.getTime())) return null; // Fecha inválida

        // Obtener el offset de la zona horaria local en minutos
        const offsetMinutes = date.getTimezoneOffset();
        const offsetHours = Math.abs(offsetMinutes / 60);
        const offsetSign = offsetMinutes <= 0 ? '+' : '-'; // Ojo: getTimezoneOffset devuelve positivo para UTC-X

        // Formatear la fecha y hora
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0'); // Añadir segundos

        // Formatear el offset
        const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:00`;

        // Construir la cadena ISO 8601 completa
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;

    } catch (e) {
        console.error("Error formatting date:", e);
        return null;
    }
};

// Componente de Formulario Reutilizable
const BloqueoForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  // Inicializar con la fecha/hora actual si es nuevo
  const nowLocal = formatDateTimeLocal(new Date().toISOString());
  // El backend usa un campo 'slot' que es un DateTimeRangeField.
  // En el form, lo manejamos como 'inicio' y 'fin' separados.
  const [inicio, setInicio] = useState(formatDateTimeLocal(initialData?.slot?.lower) || nowLocal);
  const [fin, setFin] = useState(formatDateTimeLocal(initialData?.slot?.upper) || nowLocal);
  const [motivo, setMotivo] = useState(initialData?.motivo || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!inicio || !fin) {
        setError('Las fechas/horas de inicio y fin son requeridas.');
        return;
    }
    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);

    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
        setError('Formato de fecha/hora inválido.');
        return;
    }

    if (inicioDate >= finDate) {
      setError('La fecha/hora de fin debe ser posterior a la de inicio.');
      return;
    }
     if (motivo.trim() === '') {
        setError('El motivo es requerido.');
        return;
    }

    // Convertir a ISO string con offset antes de enviar
    const inicioISO = formatToISOWithOffset(inicio);
    const finISO = formatToISOWithOffset(fin);

    if (!inicioISO || !finISO) {
        setError('Error al formatear las fechas.');
        return;
    }

    onSubmit({
      // Construir el objeto 'slot' esperado por el backend
      slot: {
        lower: inicioISO,
        upper: finISO,
      },
      motivo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="inicioBloqueo" className="block text-sm font-medium text-gray-700">
            Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="inicioBloqueo"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
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
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min={inicio || ''} // Fin debe ser >= Inicio
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
  // Ordenar por fecha de inicio descendente (más recientes primero)
  const { data: bloqueos = [], isLoading: isLoadingGet, isError, error } = useGetBloqueosQuery(undefined, {
    // Podrías añadir un selector para ordenar o filtrar si la lista crece mucho
     selectFromResult: ({ data, ...rest }) => ({
        data: data ? [...data].sort((a, b) => new Date(b.slot.lower) - new Date(a.slot.lower)) : [],
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
  const formatRangeForDisplay = (slot) => {
    if (!slot?.lower || !slot?.upper) return 'Rango inválido';
    try {
        const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const optionsTime = { hour: '2-digit', minute: '2-digit' };
        const inicio = new Date(slot.lower);
        const fin = new Date(slot.upper);

        const inicioFecha = inicio.toLocaleDateString('es-AR', optionsDate);
        const inicioHora = inicio.toLocaleTimeString('es-AR', optionsTime);
        const finFecha = fin.toLocaleDateString('es-AR', optionsDate);
        const finHora = fin.toLocaleTimeString('es-AR', optionsTime);

        if (inicioFecha === finFecha) {
            return `${inicioFecha} de ${inicioHora} a ${finHora} hs`;
        } else {
             return `Desde ${inicioFecha} ${inicioHora} hs hasta ${finFecha} ${finHora} hs`;
        }
    } catch(e) {
        return 'Fechas inválidas';
    }
  };


  // --- Renderizado ---
  if (isLoadingGet) return <div className="text-center p-4">Cargando bloqueos...</div>;
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
                      {formatRangeForDisplay(bloqueo.slot)}
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