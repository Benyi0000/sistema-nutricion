// src/features/plantillas/plantillasSlice.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.access;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const plantillasApi = createApi({
  reducerPath: 'plantillasApi',
  baseQuery,
  tagTypes: ['Plantilla', 'PlantillaPregunta'],
  endpoints: (builder) => ({
    // Listar plantillas
    getPlantillas: builder.query({
      query: ({ tipo_consulta, activo } = {}) => {
        const params = new URLSearchParams();
        if (tipo_consulta) params.append('tipo_consulta', tipo_consulta);
        if (activo !== undefined) params.append('activo', activo);
        return `/user/plantillas/?${params.toString()}`;
      },
      providesTags: ['Plantilla'],
    }),

    // Obtener plantilla por ID
    getPlantilla: builder.query({
      query: (id) => `/user/plantillas/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Plantilla', id }],
    }),

    // Crear plantilla
    createPlantilla: builder.mutation({
      query: (data) => ({
        url: '/user/plantillas/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Plantilla'],
    }),

    // Actualizar plantilla
    updatePlantilla: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/user/plantillas/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Plantilla', id },
        'Plantilla',
      ],
    }),

    // Eliminar plantilla
    deletePlantilla: builder.mutation({
      query: (id) => ({
        url: `/user/plantillas/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Plantilla'],
    }),

    // Duplicar plantilla
    duplicarPlantilla: builder.mutation({
      query: ({ id, nuevo_nombre }) => ({
        url: `/user/plantillas/${id}/duplicar/`,
        method: 'POST',
        body: { nuevo_nombre },
      }),
      invalidatesTags: ['Plantilla'],
    }),

    // Obtener plantillas predeterminadas
    getPlantillasPredeterminadas: builder.query({
      query: ({ tipo_consulta } = {}) => {
        const params = tipo_consulta ? `?tipo_consulta=${tipo_consulta}` : '';
        return `/user/plantillas/predeterminadas/${params}`;
      },
      providesTags: ['Plantilla'],
    }),

    // Listar preguntas de una plantilla
    getPreguntasPlantilla: builder.query({
      query: (plantillaId) => `/user/plantillas/${plantillaId}/preguntas/`,
      providesTags: (result, error, plantillaId) => [
        { type: 'PlantillaPregunta', id: plantillaId },
      ],
    }),

    // Agregar pregunta a plantilla
    addPreguntaPlantilla: builder.mutation({
      query: ({ plantillaId, ...data }) => ({
        url: `/user/plantillas/${plantillaId}/preguntas/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { plantillaId }) => [
        { type: 'PlantillaPregunta', id: plantillaId },
        { type: 'Plantilla', id: plantillaId },
      ],
    }),

    // Actualizar pregunta en plantilla
    updatePreguntaPlantilla: builder.mutation({
      query: ({ plantillaId, preguntaId, ...data }) => ({
        url: `/user/plantillas/${plantillaId}/preguntas/${preguntaId}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { plantillaId }) => [
        { type: 'PlantillaPregunta', id: plantillaId },
        { type: 'Plantilla', id: plantillaId },
      ],
    }),

    // Eliminar pregunta de plantilla
    deletePreguntaPlantilla: builder.mutation({
      query: ({ plantillaId, preguntaId }) => ({
        url: `/user/plantillas/${plantillaId}/preguntas/${preguntaId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { plantillaId }) => [
        { type: 'PlantillaPregunta', id: plantillaId },
        { type: 'Plantilla', id: plantillaId },
      ],
    }),
  }),
});

export const {
  useGetPlantillasQuery,
  useGetPlantillaQuery,
  useCreatePlantillaMutation,
  useUpdatePlantillaMutation,
  useDeletePlantillaMutation,
  useDuplicarPlantillaMutation,
  useGetPlantillasPredeterminadasQuery,
  useGetPreguntasPlantillaQuery,
  useAddPreguntaPlantillaMutation,
  useUpdatePreguntaPlantillaMutation,
  useDeletePreguntaPlantillaMutation,
} = plantillasApi;
