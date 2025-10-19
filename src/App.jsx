import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './app/store';
import AppRoutes from './Routes';
import api from './api/client';

function App() {
  useEffect(() => {
    // Pedir la cookie CSRF al backend al cargar la app
    api.get('/api/user/csrf-cookie/');
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
      </Router>
    </Provider>
  );
}

export default App;



