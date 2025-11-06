import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './app/store';
import AppRoutes from './Routes';
import api from './api/client';
import { fetchMe } from './features/auth/authSlice';

function AppContent() {
  const dispatch = useDispatch();
  const { access, user } = useSelector(s => s.auth);

  useEffect(() => {
    // Pedir la cookie CSRF al backend al cargar la app
    api.get('/api/user/csrf-cookie/');
  }, []);

  useEffect(() => {
    // Si hay un token pero no hay usuario, cargar los datos del usuario
    if (access && !user) {
      dispatch(fetchMe());
    }
  }, [access, user, dispatch]);

  return <AppRoutes />;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;



