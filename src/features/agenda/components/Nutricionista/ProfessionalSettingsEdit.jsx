// src/features/agenda/components/Nutricionista/ProfessionalSettingsEdit.jsx
import React, { useState, useEffect } from 'react';
import {
  useGetProfessionalSettingsQuery,
  useUpdateProfessionalSettingsMutation,
} from '../../agendaApiSlice';

// Componente de Toggle (interruptor) reutilizable para los booleanos
const Toggle = ({ label, enabled, onChange, disabled = false }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex items-center h-6 rounded-full w-11
        transition-colors ease-in-out duration-200
        ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      aria-pressed={enabled}
    >
      <span
        className={`
          inline-block w-4 h-4 transform bg-white rounded-full
          transition-transform ease-in-out duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  </label>
);


const ProfessionalSettingsEdit = () => {
  const { data: settingsData, isLoading: isLoadingGet, isError, error } = useGetProfessionalSettingsQuery();
  const [updateSettings, { isLoading: isUpdatingMutation }] = useUpdateProfessionalSettingsMutation();

  // Estado local que coincide con los campos del modelo backend
  const [formData, setFormData] = useState({
    booking_mode: 'PUBLICO',
    payments_enabled: false,
    free_cancel_hours: 24,
    min_reschedule_hours: 12,
    anticipacion_minima_hours: 2,
    anticipacion_maxima_days: 60,
    buffer_before_min: 0,
    buffer_after_min: 0,
    teleconsulta_enabled: true,
  });
  const [statusMessage, setStatusMessage] = useState('');

  // Cargar datos cuando lleguen del backend
  useEffect(() => {
    if (settingsData) {
      setFormData({
        booking_mode: settingsData.booking_mode || 'PUBLICO',
        payments_enabled: settingsData.payments_enabled || false,
        free_cancel_hours: settingsData.free_cancel_hours || 24,
        min_reschedule_hours: settingsData.min_reschedule_hours || 12,
        anticipacion_minima_hours: settingsData.anticipacion_minima_hours || 2,
        anticipacion_maxima_days: settingsData.anticipacion_maxima_days || 60,
        buffer_before_min: settingsData.buffer_before_min || 0,
        buffer_after_min: settingsData.buffer_after_min || 0,
        teleconsulta_enabled: settingsData.teleconsulta_enabled !== undefined ? settingsData.teleconsulta_enabled : true,
      });
    }
  }, [settingsData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleToggleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    
    if (!settingsData?.id) {
      setStatusMessage('Error: No se pudo cargar el ID de configuración.');
      return;
    }

    try {
      await updateSettings({ id: settingsData.id, ...formData }).unwrap();
      setStatusMessage('¡Configuración guardada con éxito!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setStatusMessage(`Error al guardar: ${err.data?.detail || err.error || 'Error desconocido'}`);
    }
  };

  // --- Renderizado ---
  if (isLoadingGet) return <div className="text-center p-4">Cargando configuración general...</div>;
  if (isError) return <div className="text-center p-4 text-red-600">Error al cargar configuración: {error?.error || error?.status || 'PARSING_ERROR'}</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Ajustes Generales de la Agenda</h3>

      {/* Modo de Reserva */}
      <div>
        <label htmlFor="booking_mode" className="block text-sm font-medium text-gray-700">
          Modo de Reserva
        </label>
        <select
          id="booking_mode"
          name="booking_mode"
          value={formData.booking_mode}
          onChange={handleChange}
          disabled={isUpdatingMutation}
          className="mt-1 block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="PUBLICO">Público (cualquiera puede reservar)</option>
          <option value="INVITACION">Solo por invitación</option>
        </select>
        <p className="mt-2 text-xs text-gray-500">
          Público: Pacientes pueden reservar directamente. Invitación: Solo pacientes invitados.
        </p>
      </div>
      
      {/* Políticas de Cancelación y Reprogramación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="free_cancel_hours" className="block text-sm font-medium text-gray-700">
            Horas para cancelar sin costo
          </label>
          <input
            type="number"
            id="free_cancel_hours"
            name="free_cancel_hours"
            value={formData.free_cancel_hours}
            onChange={handleChange}
            disabled={isUpdatingMutation}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min="0"
          />
          <p className="mt-2 text-xs text-gray-500">
            Horas antes del turno que el paciente puede cancelar sin penalización.
          </p>
        </div>
        <div>
          <label htmlFor="min_reschedule_hours" className="block text-sm font-medium text-gray-700">
            Horas mín. para reprogramar
          </label>
          <input
            type="number"
            id="min_reschedule_hours"
            name="min_reschedule_hours"
            value={formData.min_reschedule_hours}
            onChange={handleChange}
            disabled={isUpdatingMutation}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min="0"
          />
          <p className="mt-2 text-xs text-gray-500">
            Horas mínimas antes del turno para poder reprogramar.
          </p>
        </div>
      </div>

      {/* Ventanas de Anticipación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="anticipacion_minima_hours" className="block text-sm font-medium text-gray-700">
            Anticipación mínima (horas)
          </label>
          <input
            type="number"
            id="anticipacion_minima_hours"
            name="anticipacion_minima_hours"
            value={formData.anticipacion_minima_hours}
            onChange={handleChange}
            disabled={isUpdatingMutation}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min="0"
          />
          <p className="mt-2 text-xs text-gray-500">
            Horas mínimas de anticipación para reservar un turno.
          </p>
        </div>
        <div>
          <label htmlFor="anticipacion_maxima_days" className="block text-sm font-medium text-gray-700">
            Anticipación máxima (días)
          </label>
          <input
            type="number"
            id="anticipacion_maxima_days"
            name="anticipacion_maxima_days"
            value={formData.anticipacion_maxima_days}
            onChange={handleChange}
            disabled={isUpdatingMutation}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min="1"
          />
          <p className="mt-2 text-xs text-gray-500">
            Días máximos a futuro que se puede reservar.
          </p>
        </div>
      </div>

      {/* Buffers por Defecto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="buffer_before_min" className="block text-sm font-medium text-gray-700">
            Buffer antes (minutos)
          </label>
          <input
            type="number"
            id="buffer_before_min"
            name="buffer_before_min"
            value={formData.buffer_before_min}
            onChange={handleChange}
            disabled={isUpdatingMutation}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min="0"
          />
          <p className="mt-2 text-xs text-gray-500">
            Minutos de margen antes de cada consulta.
          </p>
        </div>
        <div>
          <label htmlFor="buffer_after_min" className="block text-sm font-medium text-gray-700">
            Buffer después (minutos)
          </label>
          <input
            type="number"
            id="buffer_after_min"
            name="buffer_after_min"
            value={formData.buffer_after_min}
            onChange={handleChange}
            disabled={isUpdatingMutation}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min="0"
          />
          <p className="mt-2 text-xs text-gray-500">
            Minutos de margen después de cada consulta.
          </p>
        </div>
      </div>

      {/* Opciones Booleanas (Toggles) */}
      <div className="space-y-4">
        <Toggle
          label="Habilitar pagos online"
          enabled={formData.payments_enabled}
          onChange={(value) => handleToggleChange('payments_enabled', value)}
          disabled={isUpdatingMutation}
        />
        <Toggle
          label="Permitir teleconsulta"
          enabled={formData.teleconsulta_enabled}
          onChange={(value) => handleToggleChange('teleconsulta_enabled', value)}
          disabled={isUpdatingMutation}
        />
      </div>

      {/* Botón de Guardar y Mensaje de Estado */}
      <div className="flex items-center justify-end space-x-4">
        {statusMessage && (
          <span className={`text-sm ${statusMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {statusMessage}
          </span>
        )}
        <button
          type="submit"
          disabled={isUpdatingMutation || isLoadingGet}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isUpdatingMutation ? 'Guardando...' : 'Guardar Ajustes'}
        </button>
      </div>
    </form>
  );
};

export default ProfessionalSettingsEdit;