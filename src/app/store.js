import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import legacyRootReducer from '../redux/reducers';   // reducers actuales (vanilla Redux)
import nutriAdminReducer from '../features/nutri/nutriAdminSlice';
import nutriListReducer from '../features/nutri/nutriListAdminSlice';
import preguntasReducer from '../features/preguntas/preguntasSlice';
import consultasReducer from '../features/consultas/consultasSlice';
import nutriReducer from "../features/nutri/nutriSlice";
import { agendaApiSlice } from '../features/agenda/agendaApiSlice'; 

const rootReducer = combineReducers({
  legacy: legacyRootReducer, // migración gradual
  auth: authReducer,
  nutriAdmin: nutriAdminReducer,
  nutriList: nutriListReducer,
  preguntas: preguntasReducer,
  consultas: consultasReducer,
  nutri: nutriReducer,
  [agendaApiSlice.reducerPath]: agendaApiSlice.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(agendaApiSlice.middleware),
});

export default store;
