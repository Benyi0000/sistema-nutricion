import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/client";

/**
 * Normaliza el array de respuestas antes de enviarlo al backend:
 * - Asegura que existan las claves esperadas.
 * - Trim en 'observacion' y convierte string vacío en null.
 * - Preserva flags como 'personalizada' si vienen.
 */
const normalizeRespuestasForApi = (respuestas) => {
    if (!Array.isArray(respuestas)) return [];
    return respuestas.map((r) => {
        const obs = (r?.observacion ?? "").toString().trim();
        const out = {
        pregunta: r?.pregunta ?? null,     // en tu UI usas el texto
        tipo: r?.tipo ?? null,
        codigo: r?.codigo ?? null,
        unidad: r?.unidad ?? null,
        valor: r?.valor ?? null,
        observacion: obs.length ? obs : null,
        };
        if (r?.personalizada) out.personalizada = true;
        return out;
    });
    };

    // Crear consulta inicial
    export const crearConsultaInicial = createAsyncThunk(
    "consultas/crearInicial",
    async (payload, { rejectWithValue }) => {
        try {
        const body = {
            ...payload,
            respuestas: normalizeRespuestasForApi(payload?.respuestas),
        };
        const { data } = await api.post("/api/user/consultas/inicial/", body);
        return data;
        } catch (err) {
        return rejectWithValue(
            err.response?.data || { detail: "Error al crear consulta" }
        );
        }
    }
    );

    // Crear seguimiento
    export const crearSeguimiento = createAsyncThunk(
    "consultas/crearSeguimiento",
    async (payload, { rejectWithValue }) => {
        try {
        const body = {
            ...payload,
            respuestas: normalizeRespuestasForApi(payload?.respuestas),
        };
        const { data } = await api.post(
            "/api/user/consultas/seguimiento/",
            body
        );
        return data;
        } catch (err) {
        return rejectWithValue(
            err.response?.data || { detail: "Error al crear seguimiento" }
        );
        }
    }
    );

    // Traer todas las consultas de un paciente
    export const fetchConsultasPaciente = createAsyncThunk(
    "consultas/fetchByPaciente",
    async (pacienteId, { rejectWithValue }) => {
        try {
        const { data } = await api.get(`/api/user/consultas/?paciente_id=${pacienteId}`);
        return { pacienteId, data };
        } catch (err) {
        return rejectWithValue(
            err.response?.data || { detail: "Error al cargar consultas" }
        );
        }
    }
    );

    const slice = createSlice({
    name: "consultas",
    initialState: {
        creating: "idle",
        error: null,
        lastCreated: null,
        items: [],        // lista global de consultas cargadas
        status: "idle",   // estado de carga
        porPaciente: {},  // cache por paciente
    },
    reducers: {
        clearLastCreated(state) {
        state.lastCreated = null;
        state.error = null;
        state.creating = "idle";
        },
    },
    extraReducers: (b) => {
        b
        // Crear inicial
        .addCase(crearConsultaInicial.pending, (st) => {
            st.creating = "loading";
            st.error = null;
            st.lastCreated = null;
        })
        .addCase(crearConsultaInicial.fulfilled, (st, a) => {
            st.creating = "succeeded";
            st.lastCreated = a.payload;
        })
        .addCase(crearConsultaInicial.rejected, (st, a) => {
            st.creating = "failed";
            st.error = a.payload;
        })

        // Crear seguimiento
        .addCase(crearSeguimiento.pending, (st) => {
            st.creating = "loading";
            st.error = null;
            st.lastCreated = null;
        })
        .addCase(crearSeguimiento.fulfilled, (st, a) => {
            st.creating = "succeeded";
            st.lastCreated = a.payload;
        })
        .addCase(crearSeguimiento.rejected, (st, a) => {
            st.creating = "failed";
            st.error = a.payload;
        })

        // Consultas por paciente
        .addCase(fetchConsultasPaciente.pending, (st) => {
            st.status = "loading";
            st.error = null;
        })
        .addCase(fetchConsultasPaciente.fulfilled, (st, a) => {
            st.status = "succeeded";
            st.items = a.payload.data; // guardamos en lista global
            st.porPaciente[a.payload.pacienteId] = a.payload.data;
        })
        .addCase(fetchConsultasPaciente.rejected, (st, a) => {
            st.status = "failed";
            st.error = a.payload;
        });
    },
});

export const { clearLastCreated } = slice.actions;
export default slice.reducer;
