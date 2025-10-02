import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

export const crearNutricionista = createAsyncThunk(
    'nutriAdmin/crearNutricionista',
    async (payload, { rejectWithValue }) => {
        try {
        const { data } = await api.post('/api/user/nutricionistas/', payload);
        return data; // { user_id, nutricionista_id }
        } catch (err) {
        if (err.response?.data) return rejectWithValue(err.response.data);
        return rejectWithValue({ detail: err.message || 'Error desconocido' });
        }
    }
    );

    const slice = createSlice({
    name: 'nutriAdmin',
    initialState: { status: 'idle', error: null, lastCreated: null },
    reducers: {},
    extraReducers: (b) => {
        b
        .addCase(crearNutricionista.pending, (st) => {
            st.status = 'loading'; st.error = null; st.lastCreated = null;
        })
        .addCase(crearNutricionista.fulfilled, (st, a) => {
            st.status = 'succeeded'; st.lastCreated = a.payload;
        })
        .addCase(crearNutricionista.rejected, (st, a) => {
            st.status = 'failed'; st.error = a.payload || { detail: 'Error al crear nutricionista' };
        });
    }
});

export default slice.reducer;
