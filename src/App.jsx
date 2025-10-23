import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { loadUser } from './redux/actions/auth';

// Pages
import Home from './containers/pages/Home';
import Login from './containers/pages/Login';
import NutricionistaDashboard from './containers/pages/NutricionistaDashboard';
import PacienteDashboard from './containers/pages/PacienteDashboard';
import AdminDashboard from './containers/pages/AdminDashboard';
import Unauthorized from './containers/pages/Unauthorized';
import Error404 from './containers/errors/Error404';
import FormularioCaptura from './containers/pages/FormularioCaptura';

// Components
import PrivateRoute from './components/auth/PrivateRoute';

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Cargar usuario desde localStorage al iniciar la app
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Rutas privadas - Dashboard Administrador */}
        <Route 
          path="/dashboard/admin" 
          element={
            <PrivateRoute allowedRoles={['nutricionista']}>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Rutas privadas - Dashboard Nutricionista */}
        <Route 
          path="/dashboard/nutri" 
          element={
            <PrivateRoute allowedRoles={['nutricionista']}>
              <NutricionistaDashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Formulario de captura - Solo para nutricionistas */}
        <Route 
          path="/formulario/captura" 
          element={
            <PrivateRoute allowedRoles={['nutricionista']}>
              <FormularioCaptura />
            </PrivateRoute>
          } 
        />
        
        {/* Rutas privadas - Dashboard Paciente */}
        <Route 
          path="/dashboard/paciente" 
          element={
            <PrivateRoute allowedRoles={['paciente']}>
              <PacienteDashboard />
            </PrivateRoute>
          } 
        />

        {/* Rutas que serán implementadas en futuros sprints */}
        <Route 
          path="/app/paciente/comidas" 
          element={
            <PrivateRoute allowedRoles={['paciente']}>
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Subir Comidas</h1>
                  <p className="text-gray-600 mb-6">Esta funcionalidad estará disponible en próximas versiones.</p>
                  <button 
                    disabled 
                    className="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed"
                  >
                    Subir Foto de Comida (Deshabilitado)
                  </button>
                </div>
              </div>
            </PrivateRoute>
          } 
        />
        
        {/* Catch all - 404 */}
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
