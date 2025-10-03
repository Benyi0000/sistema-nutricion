import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../src/containers/pages/Home';

import Login from './containers/pages/nutricionista/Login';
import ConsultaInicial from './containers/pages/nutricionista/ConsultaInicial';
import SeguimientoCrear from './containers/pages/nutricionista/SeguimientoCrear';
import ChangePassword from './containers/pages/auth/ChangePassword';
import PacientesList from './containers/pages/nutricionista/PacientesList';

import AdminLayout from './hocs/layouts/AdminLayout';
import DashboardAdmin from './containers/pages/admin/Dashboard';
import NutricionistasLista from './containers/pages/admin/NutricionistasLista';
import NutricionistasAdmin from './containers/pages/admin/Nutricionistas';

import NutriLayout from './hocs/layouts/NutriLayout';
import DashboardNutri from './containers/pages/nutricionista/Dashboard';

import DashboardPaciente from './containers/pages/paciente/Dashboard';

import AdminRoute from './hocs/routes/AdminRoute';
import NutriRoute from './hocs/routes/NutriRoute';
import PacienteRoute from './hocs/routes/PacienteRoute';

// --- Placeholders simples (si aún no hiciste estas páginas) ---
const ConsultasIndex = () => <div className="text-gray-700">Consultas — elige "Inicial" o "Seguimiento"</div>;
const BancoPreguntas = () => <div className="text-gray-700">Banco de preguntas</div>;
const PlantillasIndex = () => <div className="text-gray-700">Plantillas</div>;


export default function AppRoutes() {
    return (
        <Routes>
        <Route path="landing" element={<Home/>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cambiar-clave" element={<ChangePassword />} />

        {/* Admin anidado */}
        <Route
            path="/panel/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
            <Route index element={<DashboardAdmin />} />
            <Route path="nutricionistas" element={<NutricionistasLista />} />
            <Route path="nutricionistas/crear" element={<NutricionistasAdmin />} />
        </Route>

        {/* Nutricionista anidado */}
        <Route
        path="/panel/nutri"
        element={<NutriRoute><NutriLayout /></NutriRoute>}
        >
        <Route index element={<DashboardNutri />} />
        <Route path="pacientes" element={<PacientesList />} />
        <Route path="consultas" element={<ConsultasIndex />} />
        <Route path="consultas/inicial" element={<ConsultaInicial />} />
        <Route path="seguimientos/:pacienteId" element={<SeguimientoCrear />} />
        <Route path="preguntas" element={<BancoPreguntas />} />
        <Route path="plantillas" element={<PlantillasIndex />} />
        </Route>

        {/* Paciente */}
        <Route
            path="/panel/paciente"
            element={<PacienteRoute><DashboardPaciente /></PacienteRoute>}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
