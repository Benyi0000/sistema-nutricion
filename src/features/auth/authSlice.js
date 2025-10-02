import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

// Login con DNI + contraseña
export const login = createAsyncThunk('auth/login', async ({ dni, password }) => {
    const { data } = await api.post('/auth/jwt/create/', { dni, password });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    try { api.defaults.headers.common.Authorization = `JWT ${data.access}`; } catch (_) {}
    return data;
    });

    // Traer usuario actual
    export const fetchMe = createAsyncThunk('auth/me', async () => {
    const { data } = await api.get('/auth/users/me/');
    return data;
});

// (Opcional) Blacklistear el refresh en el backend
export const logoutServer = createAsyncThunk('auth/logoutServer', async (_, { getState }) => {
    try {
        const refresh = getState().auth?.refresh || localStorage.getItem('refresh');
        if (refresh) {
        await api.post('/auth/jwt/blacklist/', { refresh });
        }
    } catch (_) {
        // ignoramos errores del servidor en logout
    }
    });

    // Logout local: limpiar storage/estado
    export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    try { delete api.defaults.headers.common.Authorization; } catch (_) {}
    return true;
    });

    const initialState = {
    access: localStorage.getItem('access') || null,
    refresh: localStorage.getItem('refresh') || null,
    user: null,
    status: 'idle',
    error: null,
    };

    const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (b) => {
        b
        .addCase(login.pending, (st) => { st.status = 'loading'; st.error = null; })
        .addCase(login.fulfilled, (st, a) => {
            st.status = 'succeeded';
            st.access = a.payload.access;
            st.refresh = a.payload.refresh;
        })
        .addCase(login.rejected, (st) => { st.status = 'failed'; st.error = 'Credenciales inválidas'; })
        .addCase(fetchMe.fulfilled, (st, a) => { st.user = a.payload; })
        .addCase(logoutServer.fulfilled, (st) => st) // sin cambios de estado
        .addCase(logout.fulfilled, (st) => {
            st.access = null; st.refresh = null; st.user = null; st.status = 'idle'; st.error = null;
        });
    },
    });

export default authSlice.reducer;
