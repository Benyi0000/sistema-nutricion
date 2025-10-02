import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/client";

// --- Traer todos los pacientes asignados al nutricionista ---
export const fetchPacientes = createAsyncThunk(
    "nutri/fetchPacientes",
    async (_, { rejectWithValue }) => {
        try {
        const { data } = await api.get("/api/user/pacientes/");
        return data;
        } catch (err) {
        return rejectWithValue(
            err.response?.data || { detail: "Error al cargar pacientes" }
        );
        }
    }
    );

    // --- Traer un paciente por ID ---
    export const fetchPacienteById = createAsyncThunk(
    "nutri/fetchPacienteById",
    async (id, { rejectWithValue }) => {
        try {
        const { data } = await api.get(`/api/user/pacientes/${id}/`);
        return data;
        } catch (err) {
        return rejectWithValue(
            err.response?.data || { detail: "Error al cargar paciente" }
        );
        }
    }
    );

    const slice = createSlice({
    name: "nutri",
    initialState: {
        items: [], // lista de pacientes
        selected: null, // paciente actual (detalle)
        status: "idle",
        error: null,
    },
    reducers: {
        clearSelected(state) {
        state.selected = null;
        },
    },
    extraReducers: (b) => {
        // --- Listado ---
        b.addCase(fetchPacientes.pending, (st) => {
        st.status = "loading";
        })
        .addCase(fetchPacientes.fulfilled, (st, a) => {
            st.status = "succeeded";
            st.items = a.payload;
        })
        .addCase(fetchPacientes.rejected, (st, a) => {
            st.status = "failed";
            st.error = a.payload;
        });

        // --- Detalle ---
        b.addCase(fetchPacienteById.pending, (st) => {
        st.status = "loading";
        })
        .addCase(fetchPacienteById.fulfilled, (st, a) => {
            st.status = "succeeded";
            st.selected = a.payload;
        })
        .addCase(fetchPacienteById.rejected, (st, a) => {
            st.status = "failed";
            st.error = a.payload;
        });
    },
});

export const { clearSelected } = slice.actions;
export default slice.reducer;
