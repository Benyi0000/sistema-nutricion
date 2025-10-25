// src/features/agenda/agendaApiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// Asumiendo que tienes un selector `selectToken` en tu authSlice para obtener el JWT
import { selectToken } from '../auth/authSlice';

// Configuración base para las llamadas a la API de agenda
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/agenda/', // La URL base para los endpoints de agenda
  prepareHeaders: (headers, { getState }) => {
    // Adjuntamos el token de autenticación a cada solicitud si existe
    // Intenta obtener el token del estado de Redux primero, luego de localStorage
    const token = selectToken(getState()) || localStorage.getItem('access');
    console.log('🔐 agendaApiSlice - Token obtenido:', token ? `${token.substring(0, 20)}...` : 'NULL');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
      console.log('✅ Header Authorization configurado');
    } else {
      console.log('❌ NO hay token disponible');
    }
    return headers;
  },
});

// Definición de la API Slice para la agenda
export const agendaApiSlice = createApi({
  reducerPath: 'agendaApi', // Nombre del reducer en el store
  baseQuery: baseQuery,
  // Tipos de 'tags' para invalidación automática de caché
  tagTypes: ['Ubicacion', 'TipoConsulta', 'Disponibilidad', 'Bloqueo', 'Turno', 'Slot', 'ProfessionalSettings'],
  endpoints: (builder) => ({

    // === QUERIES (Obtener datos) ===

    // --- Configuración Profesional ---
    getProfessionalSettings: builder.query({
        query: () => 'professional-settings/',
        providesTags: ['ProfessionalSettings'],
    }),
    updateProfessionalSettings: builder.mutation({
        query: (settings) => ({
            url: `professional-settings/${settings.id}/`,
            method: 'PATCH',
            body: settings,
        }),
        invalidatesTags: ['ProfessionalSettings'],
    }),

    // --- Ubicaciones ---
    getUbicaciones: builder.query({
      query: (nutricionistaId) => nutricionistaId 
        ? `nutricionista/${nutricionistaId}/ubicaciones/`
        : 'ubicaciones/',
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'Ubicacion', id })), // Tags individuales
        { type: 'Ubicacion', id: 'LIST' }, // Tag para la lista completa
      ],
    }),

    // --- Tipos de Consulta ---
    getTiposConsulta: builder.query({
      query: (nutricionistaId) => nutricionistaId 
        ? `nutricionista/${nutricionistaId}/tipos-consulta/`
        : 'tipos-consulta/',
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'TipoConsulta', id })),
        { type: 'TipoConsulta', id: 'LIST' },
      ],
    }),

    // --- Disponibilidades Horarias ---
    getDisponibilidades: builder.query({
      query: () => 'disponibilidades/',
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'Disponibilidad', id })),
        { type: 'Disponibilidad', id: 'LIST' },
      ],
    }),

    // --- Bloqueos de Disponibilidad ---
    getBloqueos: builder.query({
      query: () => 'bloqueos/',
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'Bloqueo', id })),
        { type: 'Bloqueo', id: 'LIST' },
      ],
    }),

    // --- Slots Disponibles ---
    getAvailableSlots: builder.query({
      // Los parámetros se pasan al usar el hook, ej: useGetAvailableSlotsQuery({ nutricionistaId: 1, ... })
      query: ({ nutricionistaId, fechaInicio, fechaFin, duracion, ubicacionId }) => {
        let url = `nutricionista/${nutricionistaId}/slots/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
        if (duracion) {
            url += `&duracion=${duracion}`;
        }
        if (ubicacionId) {
            url += `&ubicacion_id=${ubicacionId}`;
        }
        return url;
      },
      // Los slots dependen de Disponibilidades, Bloqueos y Turnos existentes.
      // Invalidar 'Slot' cuando cualquiera de estos cambie podría ser una estrategia.
      providesTags: ['Slot'],
    }),

    // --- Turnos ---
    getTurnos: builder.query({
      // Permite filtrar por query params, ej: useGetTurnosQuery({ estado: 'TENTATIVO' })
      query: (params) => ({ url: 'turnos/', params }),
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: 'Turno', id })),
        { type: 'Turno', id: 'LIST' },
      ],
    }),
    getTurnoById: builder.query({
        query: (id) => `turnos/${id}/`,
        providesTags: (_result, _error, id) => [{ type: 'Turno', id }],
    }),

    // === MUTATIONS (Modificar datos) ===

    // --- Ubicaciones ---
    addUbicacion: builder.mutation({
      query: (newUbicacion) => ({
        url: 'ubicaciones/',
        method: 'POST',
        body: newUbicacion,
      }),
      invalidatesTags: [{ type: 'Ubicacion', id: 'LIST' }], // Invalida la lista para refetch
    }),
    updateUbicacion: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `ubicaciones/${id}/`,
        method: 'PATCH', // o PUT si reemplazas completo
        body: patch,
      }),
      // Invalida el tag individual y el de la lista
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Ubicacion', id }, { type: 'Ubicacion', id: 'LIST' }],
    }),
    deleteUbicacion: builder.mutation({
        query: (id) => ({
          url: `ubicaciones/${id}/`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [{ type: 'Ubicacion', id }, { type: 'Ubicacion', id: 'LIST' }],
    }),

    // --- Tipos de Consulta ---
    addTipoConsulta: builder.mutation({
      query: (newTipoConsulta) => ({
        url: 'tipos-consulta/',
        method: 'POST',
        body: newTipoConsulta,
      }),
      invalidatesTags: [{ type: 'TipoConsulta', id: 'LIST' }],
    }),
    updateTipoConsulta: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `tipos-consulta/${id}/`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'TipoConsulta', id }, { type: 'TipoConsulta', id: 'LIST' }],
    }),
     deleteTipoConsulta: builder.mutation({
        query: (id) => ({
          url: `tipos-consulta/${id}/`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [{ type: 'TipoConsulta', id }, { type: 'TipoConsulta', id: 'LIST' }],
    }),

    // --- Disponibilidades Horarias ---
    addDisponibilidad: builder.mutation({
      query: (newDisponibilidad) => ({
        url: 'disponibilidades/',
        method: 'POST',
        body: newDisponibilidad,
      }),
      invalidatesTags: [{ type: 'Disponibilidad', id: 'LIST' }, 'Slot'], // Cambiar disponibilidad afecta los slots
    }),
    updateDisponibilidad: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `disponibilidades/${id}/`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Disponibilidad', id }, { type: 'Disponibilidad', id: 'LIST' }, 'Slot'],
    }),
    deleteDisponibilidad: builder.mutation({
        query: (id) => ({
          url: `disponibilidades/${id}/`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [{ type: 'Disponibilidad', id }, { type: 'Disponibilidad', id: 'LIST' }, 'Slot'],
    }),

    // --- Bloqueos ---
    addBloqueo: builder.mutation({
      query: (newBloqueo) => ({
        url: 'bloqueos/',
        method: 'POST',
        body: newBloqueo,
      }),
      invalidatesTags: [{ type: 'Bloqueo', id: 'LIST' }, 'Slot'], // Bloqueos afectan slots
    }),
    updateBloqueo: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `bloqueos/${id}/`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Bloqueo', id }, { type: 'Bloqueo', id: 'LIST' }, 'Slot'],
    }),
     deleteBloqueo: builder.mutation({
        query: (id) => ({
          url: `bloqueos/${id}/`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [{ type: 'Bloqueo', id }, { type: 'Bloqueo', id: 'LIST' }, 'Slot'],
    }),

    // --- Turnos (Acciones) ---
    solicitarTurno: builder.mutation({
      query: (turnoData) => ({
        url: 'turnos/',
        method: 'POST',
        body: turnoData, // { nutricionista_id, slot: { lower, upper }, tipo_consulta, ubicacion?, notas_paciente? }
      }),
      // Invalida la lista de turnos y los slots (porque uno fue tomado)
      invalidatesTags: [{ type: 'Turno', id: 'LIST' }, 'Slot'],
    }),
    aprobarTurno: builder.mutation({
      query: (turnoId) => ({
        url: `turnos/${turnoId}/aprobar/`,
        method: 'POST',
      }),
      // Invalida el turno específico, la lista y los slots (por si había conflictos)
      invalidatesTags: (_result, _error, turnoId) => [{ type: 'Turno', id: turnoId }, { type: 'Turno', id: 'LIST' }, 'Slot'],
    }),
    cancelarTurno: builder.mutation({
        query: (turnoId) => ({
          url: `turnos/${turnoId}/cancelar/`,
          method: 'POST',
          // Podrías necesitar enviar una razón en el body si la API lo requiere: body: { razon: '...' }
        }),
        // Invalida el turno específico, la lista y libera el slot
        invalidatesTags: (_result, _error, turnoId) => [{ type: 'Turno', id: turnoId }, { type: 'Turno', id: 'LIST' }, 'Slot'],
    }),
    // Podrías añadir una mutación genérica para actualizar notas del turno si es necesario
    updateTurnoNotas: builder.mutation({
        query: ({ id, ...patch }) => ({ // Ej: patch = { notas_nutricionista: 'Nuevo comentario' }
          url: `turnos/${id}/`,
          method: 'PATCH',
          body: patch,
        }),
        invalidatesTags: (_result, _error, { id }) => [{ type: 'Turno', id }, { type: 'Turno', id: 'LIST' }],
    }),

  }),
});

// Exportamos los hooks autogenerados por RTK Query para usarlos en los componentes
export const {
  // Hooks Configuración Profesional
  useGetProfessionalSettingsQuery,
  useUpdateProfessionalSettingsMutation,
  // Hooks Ubicaciones
  useGetUbicacionesQuery,
  useAddUbicacionMutation,
  useUpdateUbicacionMutation,
  useDeleteUbicacionMutation,
  // Hooks Tipos Consulta
  useGetTiposConsultaQuery,
  useAddTipoConsultaMutation,
  useUpdateTipoConsultaMutation,
  useDeleteTipoConsultaMutation,
  // Hooks Disponibilidades
  useGetDisponibilidadesQuery,
  useAddDisponibilidadMutation,
  useUpdateDisponibilidadMutation,
  useDeleteDisponibilidadMutation,
  // Hooks Bloqueos
  useGetBloqueosQuery,
  useAddBloqueoMutation,
  useUpdateBloqueoMutation,
  useDeleteBloqueoMutation,
  // Hooks Slots y Turnos
  useGetAvailableSlotsQuery,
  useGetTurnosQuery,
  useGetTurnoByIdQuery,
  useSolicitarTurnoMutation,
  useAprobarTurnoMutation,
  useCancelarTurnoMutation,
  useUpdateTurnoNotasMutation,
} = agendaApiSlice;