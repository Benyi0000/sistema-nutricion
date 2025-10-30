// src/features/agenda/publicAgendaApiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// API pública para el turnero (sin autenticación)
export const publicAgendaApiSlice = createApi({
  reducerPath: 'publicAgendaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/public/agenda/',
  }),
  tagTypes: ['PublicSlots', 'PublicTurno'],
  endpoints: (builder) => ({
    // GET slots disponibles
    getPublicSlots: builder.query({
      query: ({ nutricionistaId, ubicacionId, tipoConsultaId, startDate, endDate }) => ({
        url: 'slots/',
        params: {
          nutricionista_id: nutricionistaId,
          ubicacion_id: ubicacionId,
          tipo_consulta_id: tipoConsultaId,
          start_date: startDate, // YYYY-MM-DD
          end_date: endDate,     // YYYY-MM-DD
        },
      }),
      providesTags: ['PublicSlots'],
    }),

    // POST crear turno tentativo
    createPublicTurno: builder.mutation({
      query: (turnoData) => ({
        url: 'turnos/',
        method: 'POST',
        body: turnoData,
      }),
      invalidatesTags: ['PublicSlots'],
    }),

    // POST verificar y confirmar turno con token
    verifyPublicTurno: builder.mutation({
      query: (token) => ({
        url: 'turnos/verify/',
        method: 'POST',
        body: { token },
      }),
    }),
  }),
});

export const {
  useGetPublicSlotsQuery,
  useCreatePublicTurnoMutation,
  useVerifyPublicTurnoMutation,
} = publicAgendaApiSlice;
