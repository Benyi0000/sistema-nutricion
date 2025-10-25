// src/features/agenda/components/Nutricionista/DisponibilidadListEdit.jsx
import React, { useState } from 'react';
import {
  useGetDisponibilidadesQuery,
  useAddDisponibilidadMutation,
  useUpdateDisponibilidadMutation,
  useDeleteDisponibilidadMutation,
} from '../../agendaApiSlice'; // Ajusta la ruta

// Opciones para el selector de día de la semana
const diasSemanaOptions = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

// Helper para convertir "HH:MM:SS" a "HH:MM"
const formatTimeToHHMM = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.split(':').slice(0, 2).join(':');
};

// Helper para formatear fecha YYYY-MM-DD
const formatDate = (date) => {
    if (!date) return '';
    // Si ya está en formato YYYY-MM-DD (viene de la API o del input date), devolverlo
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
    }
    // Si es un objeto Date, formatearlo
    try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return ''; // Devuelve vacío si la fecha no es válida
    }
};


// Componente de Formulario Reutilizable
const DisponibilidadForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  const today = formatDate(new Date());
  // El backend espera horas en formato HH:MM:SS, pero el input "time" usa HH:MM
  const formatTimeToHHMM = (timeStr) => timeStr?.substring(0, 5) || '';
  const formatTimeToHHMMSS = (timeStr) => (timeStr ? `${timeStr}:00` : '00:00:00');

  const [dia_semana, setDiaSemana] = useState(initialData?.dia_semana ?? 0); // Default Lunes
  const [hora_inicio, setHoraInicio] = useState(formatTimeToHHMM(initialData?.hora_inicio) || '09:00');
  const [hora_fin, setHoraFin] = useState(formatTimeToHHMM(initialData?.hora_fin) || '17:00');
  const [fecha_inicio, setFechaInicio] = useState(formatDate(initialData?.fecha_inicio) || today);
  // Default fecha fin a un año desde hoy si es nuevo
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
  const [fecha_fin, setFechaFin] = useState(formatDate(initialData?.fecha_fin) || formatDate(defaultEndDate));

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores

    // Validaciones
    if (!hora_inicio || !hora_fin) {
        setError('Las horas de inicio y fin son requeridas.');
        return;
    }
    if (hora_inicio >= hora_fin) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
     if (!fecha_inicio || !fecha_fin) {
        setError('Las fechas de inicio y fin son requeridas.');
        return;
    }
    if (fecha_inicio > fecha_fin) {
        setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
    }


    onSubmit({
      dia_semana: parseInt(dia_semana, 10),
      hora_inicio: formatTimeToHHMMSS(hora_inicio), // Asegurar HH:MM:SS
      hora_fin: formatTimeToHHMMSS(hora_fin),     // Asegurar HH:MM:SS
      fecha_inicio,
      fecha_fin,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dia_semana" className="block text-sm font-medium text-gray-700">
            Día de la Semana <span className="text-red-500">*</span>
          </label>
          <select
            id="dia_semana"
            value={dia_semana}
            onChange={(e) => setDiaSemana(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isLoading}
          >
            {diasSemanaOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
         {/* Podrías dejar este campo vacío o añadir otro si necesitas diferenciar */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hora_inicio" className="block text-sm font-medium text-gray-700">
            Hora Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="hora_inicio"
            value={hora_inicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="hora_fin" className="block text-sm font-medium text-gray-700">
            Hora Fin <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="hora_fin"
            value={hora_fin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isLoading}
          />
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">
            Válido Desde <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="fecha_inicio"
            value={fecha_inicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            min={today} // Opcional: No permitir fechas pasadas
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700">
            Válido Hasta <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="fecha_fin"
            value={fecha_fin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
             min={fecha_inicio || today} // Asegurar que sea >= fecha_inicio
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
          {isLoading ? 'Guardando...' : (initialData ? 'Actualizar Regla' : 'Añadir Regla')}
        </button>
      </div>
    </form>
  );
};


const DisponibilidadListEdit = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingDisponibilidad, setEditingDisponibilidad] = useState(null);

  // --- RTK Query Hooks ---
  const { data: disponibilidades = [], isLoading: isLoadingGet, isError, error } = useGetDisponibilidadesQuery();
  const [addDisponibilidad, { isLoading: isAddingMutation }] = useAddDisponibilidadMutation();
  const [updateDisponibilidad, { isLoading: isUpdatingMutation }] = useUpdateDisponibilidadMutation();
  const [deleteDisponibilidad, { isLoading: isDeletingMutation }] = useDeleteDisponibilidadMutation();
  // -----------------------

  const handleAddNew = async (formData) => {
    try {
      await addDisponibilidad(formData).unwrap();
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add disponibilidad:', err);
      alert(`Error al añadir: ${err.data?.detail || err.error || 'Verifica que no haya solapamientos'}`);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingDisponibilidad) return;
    try {
      await updateDisponibilidad({ id: editingDisponibilidad.id, ...formData }).unwrap();
      setEditingDisponibilidad(null);
    } catch (err) {
      console.error('Failed to update disponibilidad:', err);
      alert(`Error al actualizar: ${err.data?.detail || err.error || 'Verifica que no haya solapamientos'}`);
    }
  };

   const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta regla de disponibilidad?')) {
      try {
        await deleteDisponibilidad(id).unwrap();
      } catch (err) {
        console.error('Failed to delete disponibilidad:', err);
        alert(`Error al eliminar: ${err.data?.detail || err.error || 'Error desconocido'}`);
      }
    }
  };

  // --- Renderizado ---
  if (isLoadingGet) return <div className="text-center p-4">Cargando disponibilidades...</div>;
  if (isError) return <div className="text-center p-4 text-red-600">Error al cargar disponibilidades: {error?.data?.detail || error.status}</div>;

  // Agrupar por día de la semana para mejor visualización
  const groupedDisponibilidades = disponibilidades.reduce((acc, curr) => {
    const dayLabel = diasSemanaOptions.find(d => d.value === curr.dia_semana)?.label || 'Desconocido';
    if (!acc[dayLabel]) {
      acc[dayLabel] = [];
    }
    acc[dayLabel].push(curr);
    // Ordenar dentro de cada día por hora de inicio
    acc[dayLabel].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    return acc;
  }, {});

  // Ordenar los días de la semana
   const orderedDays = diasSemanaOptions.map(d => d.label);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Gestionar Disponibilidad Horaria (Reglas Recurrentes)</h3>
        {!isAdding && !editingDisponibilidad && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Añadir Regla
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Nueva Regla de Disponibilidad</h4>
          <DisponibilidadForm
            onSubmit={handleAddNew}
            isLoading={isAddingMutation}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {editingDisponibilidad && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
          <h4 className="text-md font-medium mb-3 text-gray-800">Editando Regla</h4>
          <DisponibilidadForm
            initialData={editingDisponibilidad}
            onSubmit={handleUpdate}
            isLoading={isUpdatingMutation}
            onCancel={() => setEditingDisponibilidad(null)}
          />
        </div>
      )}

      {!isAdding && !editingDisponibilidad && (
        <div>
          {disponibilidades.length > 0 ? (
             orderedDays.map(dayLabel => (
               groupedDisponibilidades[dayLabel] && (
                 <div key={dayLabel} className="mb-4">
                   <h4 className="text-md font-semibold text-gray-700 mb-2">{dayLabel}</h4>
                   <ul className="divide-y divide-gray-200 border rounded">
                     {groupedDisponibilidades[dayLabel].map((disp) => (
                       <li key={disp.id} className="px-4 py-3 flex justify-between items-center space-x-4">
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-gray-900 truncate">
                             🕒 {formatTimeToHHMM(disp.hora_inicio)} - {formatTimeToHHMM(disp.hora_fin)}
                           </p>
                           <p className="text-sm text-gray-500 truncate">
                             📅 Válido: {formatDate(disp.fecha_inicio)} hasta {formatDate(disp.fecha_fin)}
                           </p>
                         </div>
                         <div className="flex-shrink-0 flex space-x-2">
                            <button
                               onClick={() => setEditingDisponibilidad(disp)}
                               disabled={isUpdatingMutation || isDeletingMutation}
                               className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
                            >
                              Editar
                            </button>
                           <button
                             onClick={() => handleDelete(disp.id)}
                             disabled={isDeletingMutation || isUpdatingMutation}
                             className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                           >
                             Eliminar
                           </button>
                         </div>
                       </li>
                     ))}
                   </ul>
                 </div>
               )
             ))
          ) : (
            <p className="text-center text-gray-500 py-4">No hay reglas de disponibilidad configuradas.</p>
          )}
        </div>
      )}

      {(isAddingMutation || isUpdatingMutation || isDeletingMutation) && (
        <div className="mt-4 text-sm text-gray-500 text-center">Procesando...</div>
      )}
    </div>
  );
};

export default DisponibilidadListEdit;