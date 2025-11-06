// src/app/store.js (o src/store.js)
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../redux/reducers'; // Mantenemos tus reducers existentes
import { agendaApiSlice } from '../features/agenda/agendaApiSlice'; // Importamos la API Slice
import { publicAgendaApiSlice } from '../features/agenda/publicAgendaApiSlice'; // API pública

export const store = configureStore({
  reducer: {
    // Aquí combinamos tus reducers existentes con el reducer generado por RTK Query.
    // Asumimos que 'rootReducer' es un objeto con tus reducers (ej: { auth: authReducer, ... })
    // Si 'rootReducer' es una función combinada, necesitarás ajustarlo.
    // Opción 1: Si rootReducer es un objeto de slices
     ...rootReducer, // Desestructura tus reducers existentes aquí

    // Opción 2: Si rootReducer es el resultado de combineReducers,
    // puedes necesitar reorganizar tus reducers existentes en slices individuales
    // y listarlos aquí junto con agendaApi.reducerPath. Ejemplo:
    // auth: authReducer, // Suponiendo que tienes un authReducer
    // consultas: consultasReducer, // Suponiendo que tienes un consultasReducer

    // Añade el reducer de la API Slice. Usa el reducerPath que definiste.
    [agendaApiSlice.reducerPath]: agendaApiSlice.reducer,
    [publicAgendaApiSlice.reducerPath]: publicAgendaApiSlice.reducer,
  },
  // El middleware de RTK Query se añade automáticamente aquí.
  // configureStore incluye redux-thunk y Redux DevTools Extension por defecto.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(agendaApiSlice.middleware)
      .concat(publicAgendaApiSlice.middleware),
  // Habilita Redux DevTools solo en desarrollo (esto es automático con configureStore)
  devTools: import.meta.env.DEV,
});

export default store;