import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

export const fetchNutricionistas = createAsyncThunk(
    'nutriList/fetchNutricionistas',
    async ({ page = 1, page_size = 10, search = '' } = {}, { rejectWithValue }) => {
        try {
        const params = new URLSearchParams();
        params.set('page', page);
        params.set('page_size', page_size);
        if (search) params.set('search', search);
        const { data } = await api.get(`/api/user/nutricionistas/?${params.toString()}`);
        return { ...data, page, page_size, search };
        } catch (err) {
        if (err.response?.data) return rejectWithValue(err.response.data);
        return rejectWithValue({ detail: err.message || 'Error al cargar' });
        }
    }
    );

    const slice = createSlice({
    name: 'nutriList',
    initialState: {
        items: [],
        count: 0,
        num_pages: 0,
        page: 1,
        page_size: 10,
        search: '',
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (b) => {
        b
        .addCase(fetchNutricionistas.pending, (st) => {
            st.status = 'loading'; st.error = null;
        })
        .addCase(fetchNutricionistas.fulfilled, (st, a) => {
            st.status = 'succeeded';
            st.items = a.payload.results || [];
            st.count = a.payload.count || 0;
            st.num_pages = a.payload.num_pages || 0;
            st.page = a.payload.page || 1;
            st.page_size = a.payload.page_size || 10;
            st.search = a.payload.search || '';
        })
        .addCase(fetchNutricionistas.rejected, (st, a) => {
            st.status = 'failed';
            st.error = a.payload || { detail: 'Error al cargar' };
        });
    }
});

export default slice.reducer;
