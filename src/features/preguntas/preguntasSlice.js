// src/features/preguntas/preguntasSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

// --- helpers ---
const intoArray = (data) =>
    Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);

    // Traer preguntas por scope (inicial | seguimiento)
    export const fetchPreguntas = createAsyncThunk(
    'preguntas/fetch',
    async ({ scope = 'inicial' } = {}, { rejectWithValue }) => {
        try {
        const { data } = await api.get(`/api/user/preguntas/?scope=${scope}`);
        return { scope, data: intoArray(data) };
        } catch (err) {
        return rejectWithValue(err.response?.data || { detail: 'Error al cargar preguntas' });
        }
    }
    );

    // Banco: preguntas personalizadas del/la nutricionista
    export const fetchPreguntasPersonalizadas = createAsyncThunk(
    'preguntas/fetchPersonalizadas',
    async (_, { rejectWithValue }) => {
        try {
        const { data } = await api.get(`/api/user/preguntas/personalizadas/`);
        return intoArray(data);
        } catch (err) {
        return rejectWithValue(err.response?.data || { detail: 'Error al cargar preguntas personalizadas' });
        }
    }
    );

    // Crear una pregunta personalizada
    export const crearPreguntaPersonalizada = createAsyncThunk(
    'preguntas/crearPersonalizada',
    async (payload, { rejectWithValue }) => {
        try {
        // normalización mínima en front para evitar 400
        const mapTipo = (t = "") => {
            const v = String(t).toLowerCase().trim();
            const M = {
            multi: 'multi', multi_choice: 'multi', opcion_multiple: 'multi', checkbox: 'multi',
            single: 'single', single_choice: 'single', opcion_unica: 'single', radio: 'single', select: 'single',
            boolean: 'boolean', si_no: 'boolean', yes_no: 'boolean',
            text: 'text', short_text: 'text', long_text: 'text', texto: 'text', texto_corto: 'text', texto_largo: 'text',
            integer: 'integer', entero: 'integer',
            decimal: 'decimal', float: 'decimal', number: 'decimal', numeric: 'decimal', numero: 'decimal',
            date: 'date', fecha: 'date',
            };
            return M[v] || 'text';
        };

        const limpiarUnidad = (u) => {
            const s = String(u || '').trim();
            if (!s || s === 'kg, cm, veces/día...' || s === 'placeholder' || s === '-') return '';
            return s;
        };

        const normOpciones = (opcs) => {
            const arr = Array.isArray(opcs) ? opcs : [];
            return arr.map((x) =>
            typeof x === 'string'
                ? { valor: x.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') || 'opt', etiqueta: x.trim() }
                : {
                    valor:
                    (x?.valor ||
                        (x?.etiqueta || x?.label || '')
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_-]/g, '')) || 'opt',
                    etiqueta: (x?.etiqueta || x?.label || x?.valor || '').trim(),
                }
            ).filter((o) => o.etiqueta);
        };

        const tipo = mapTipo(payload?.tipo);
        const body = {
            texto: String(payload?.texto || '').trim(),
            tipo,
            codigo: String(payload?.codigo || '').trim(),
            requerido: !!payload?.requerido,
            unidad: limpiarUnidad(payload?.unidad),
            opciones: (tipo === 'single' || tipo === 'multi') ? normOpciones(payload?.opciones) : [],
        };

        const { data } = await api.post(`/api/user/preguntas/personalizadas/`, body);
        return data; // devuelve la pregunta creada
        } catch (err) {
        return rejectWithValue(err.response?.data || { detail: 'Error al crear pregunta personalizada' });
        }
    }
    );

    const slice = createSlice({
    name: 'preguntas',
    initialState: {
        byScope: {
        inicial: [],
        seguimiento: [],
        personalizadas: [],
        },
        status: 'idle',    // estado carga de fetchPreguntas
        error: null,
        creating: 'idle',  // estado de crearPreguntaPersonalizada
    },
    reducers: {},
    extraReducers: (b) => {
        b
        // fetchPreguntas
        .addCase(fetchPreguntas.pending, (st) => {
            st.status = 'loading'; st.error = null;
        })
        .addCase(fetchPreguntas.fulfilled, (st, a) => {
            st.status = 'succeeded';
            st.byScope[a.payload.scope] = a.payload.data;
        })
        .addCase(fetchPreguntas.rejected, (st, a) => {
            st.status = 'failed'; st.error = a.payload;
        })

        // fetchPreguntasPersonalizadas
        .addCase(fetchPreguntasPersonalizadas.fulfilled, (st, a) => {
            st.byScope.personalizadas = a.payload;
        })
        .addCase(fetchPreguntasPersonalizadas.rejected, (st, a) => {
            st.error = a.payload;
        })

        // crearPreguntaPersonalizada
        .addCase(crearPreguntaPersonalizada.pending, (st) => {
            st.creating = 'loading'; st.error = null;
        })
        .addCase(crearPreguntaPersonalizada.fulfilled, (st, a) => {
            st.creating = 'succeeded';
            st.byScope.personalizadas = [a.payload, ...(st.byScope.personalizadas || [])];
        })
        .addCase(crearPreguntaPersonalizada.rejected, (st, a) => {
            st.creating = 'failed'; st.error = a.payload;
        });
  },
});

// 👇 MUY IMPORTANTE para que el import por default en store.js funcione
export default slice.reducer;
