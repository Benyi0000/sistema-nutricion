// src/features/agenda/components/Nutricionista/ProfessionalSettingsEdit.jsx
import React, { useMemo, useState, useEffect } from 'react'
import {
  useGetProfessionalSettingsQuery,
  useUpdateProfessionalSettingsMutation,
} from '../../agendaApiSlice'

const BOOKING_OPTS = [
  { value: 'PUBLICO', label: 'Público (cualquiera puede reservar)' },
  { value: 'PRIVADO', label: 'Privado (solo internos)' },
]

export default function ProfessionalSettingsEdit() {
  const { data: settings, isFetching, refetch } = useGetProfessionalSettingsQuery()
  const [updateSettings, { isLoading: updating }] = useUpdateProfessionalSettingsMutation()

  const [form, setForm] = useState({
    booking_mode: 'PUBLICO',
    payments_enabled: false,
    free_cancel_hours: 24,
    min_reschedule_hours: 24,
    buffer_before_min: 0,
    buffer_after_min: 0,
    anticipacion_minima_hours: 1,
    anticipacion_maxima_days: 60,
    teleconsulta_enabled: true,
  })

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        ...settings,
        // mapea del backend si viniera timedeltas serializados (string/segundos) — si ya vienen como enteros, esto no afecta
        anticipacion_minima_hours: settings.anticipacion_minima_hours ?? prev.anticipacion_minima_hours,
        anticipacion_maxima_days: settings.anticipacion_maxima_days ?? prev.anticipacion_maxima_days,
      }))
    }
  }, [settings])

  const busy = isFetching || updating

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (settings && settings.id) {
      await updateSettings({ id: settings.id, ...form }).unwrap()
      refetch()
    } else {
      alert('No se encontró configuración para actualizar. Contacte al administrador.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Modo de reserva</span>
          <select name="booking_mode" value={form.booking_mode} onChange={handleChange} className="border rounded p-2">
            {BOOKING_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="payments_enabled" checked={form.payments_enabled} onChange={handleChange} />
          <span>Habilitar pagos</span>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Cancelación gratis (horas)</span>
          <input type="number" name="free_cancel_hours" value={form.free_cancel_hours} onChange={handleChange} className="border rounded p-2" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Reprogramación mínima (horas)</span>
          <input type="number" name="min_reschedule_hours" value={form.min_reschedule_hours} onChange={handleChange} className="border rounded p-2" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Buffer antes (minutos)</span>
          <span className="text-xs text-gray-500 mb-1">
            ⏰ Tiempo de preparación antes de cada consulta (ej: revisar historial, preparar consultorio)
          </span>
          <input 
            type="number" 
            name="buffer_before_min" 
            value={form.buffer_before_min} 
            onChange={handleChange} 
            className="border rounded p-2"
            min="0"
            placeholder="0"
          />
          <span className="text-xs text-gray-400 mt-1">
            Este tiempo se bloquea automáticamente antes de cada turno
          </span>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Buffer después (minutos)</span>
          <span className="text-xs text-gray-500 mb-1">
            📝 Tiempo después de cada consulta (ej: completar notas, limpiar/ventilar consultorio)
          </span>
          <input 
            type="number" 
            name="buffer_after_min" 
            value={form.buffer_after_min} 
            onChange={handleChange} 
            className="border rounded p-2"
            min="0"
            placeholder="0"
          />
          <span className="text-xs text-gray-400 mt-1">
            Este tiempo se bloquea automáticamente después de cada turno
          </span>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Anticipación mínima (horas)</span>
          <input type="number" name="anticipacion_minima_hours" value={form.anticipacion_minima_hours} onChange={handleChange} className="border rounded p-2" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Anticipación máxima (días)</span>
          <input type="number" name="anticipacion_maxima_days" value={form.anticipacion_maxima_days} onChange={handleChange} className="border rounded p-2" />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="teleconsulta_enabled" checked={form.teleconsulta_enabled} onChange={handleChange} />
          <span>Habilitar teleconsulta</span>
        </label>
      </div>

      <button disabled={busy} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
        {settings ? 'Guardar cambios' : 'Crear configuración'}
      </button>
    </form>
  )
}
