import { Routes, Route, Navigate } from 'react-router-dom';

// --- Páginas Existentes ---
import Home from '../src/containers/pages/Home';
import Login from './containers/pages/nutricionista/Login'; // Asumiendo que es el login general
import ConsultaInicial from './containers/pages/nutricionista/ConsultaInicial';
import SeguimientoCrear from './containers/pages/nutricionista/SeguimientoCrear';
import ChangePassword from './containers/pages/auth/ChangePassword';
import PacientesList from './containers/pages/nutricionista/PacientesList';

// --- Layouts (Confirmados Existentes) ---
import AdminLayout from './hocs/layouts/AdminLayout';
import NutriLayout from './hocs/layouts/NutriLayout';
import PacienteLayout from './hocs/layouts/PacienteLayout'; // <-- Confirmado que existe

// --- Páginas Admin ---
import DashboardAdmin from './containers/pages/admin/Dashboard';
import NutricionistasLista from './containers/pages/admin/NutricionistasLista';
import NutricionistasAdmin from './containers/pages/admin/Nutricionistas';
import ConfiguracionAdminPage from './containers/pages/admin/Configuracion';

// --- Páginas Nutricionista ---
import DashboardNutri from '../src/containers/pages/nutricionista/Dashboard';
import Configuracion from '../src/containers/pages/nutricionista/Configuracion';
// --- ¡NUEVAS Páginas Agenda Nutricionista! ---
// (Asegúrate de crear estos archivos de página)
import AgendaConfigPage from './containers/pages/nutricionista/AgendaConfigPage';
import TurnosManagePage from './containers/pages/nutricionista/TurnosManagePage';

// --- Páginas Paciente ---
import DashboardPaciente from './containers/pages/paciente/Dashboard';
// --- ¡NUEVAS Páginas Agenda Paciente! ---
// (Asegúrate de crear estos archivos de página)
import TurnosViewPage from './containers/pages/paciente/TurnosViewPage';
// import MisTurnosPage from './containers/pages/paciente/MisTurnosPage'; // Opcional

// --- Rutas Protegidas HOCs ---
import AdminRoute from './hocs/routes/AdminRoute';
import NutriRoute from './hocs/routes/NutriRoute';
import PacienteRoute from './hocs/routes/PacienteRoute';

// --- Placeholders simples (si aún no hiciste estas páginas) ---
const ConsultasIndex = () => <div className="text-gray-700 p-4">Consultas — elige "Inicial" o "Seguimiento"</div>;
const BancoPreguntas = () => <div className="text-gray-700 p-4">Banco de preguntas</div>;
const PlantillasIndex = () => <div className="text-gray-700 p-4">Plantillas</div>;
// Placeholder para Mis Turnos (si decides añadir la ruta)
const MisTurnosPage = () => <div className="text-gray-700 p-4">Mis Turnos (Próximamente)</div>;

export default function AppRoutes() {
    return (
        <Routes>
            {/* Rutas Públicas */}
            <Route path="landing" element={<Home />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cambiar-clave" element={<ChangePassword />} />

            {/* --- Panel Admin --- */}
            <Route
                path="/panel/admin"
                element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
                <Route index element={<DashboardAdmin />} />
                <Route path="nutricionistas" element={<NutricionistasLista />} />
                <Route path="nutricionistas/crear" element={<NutricionistasAdmin />} />
                <Route path="configuracion" element={<ConfiguracionAdminPage />} />
                {/* Podrías añadir rutas de admin para agenda aquí si es necesario */}
            </Route>

            {/* --- Panel Nutricionista --- */}
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
                <Route path="configuracion" element={<Configuracion />} />
                {/* ¡NUEVAS Rutas Agenda Nutricionista! */}
                <Route path="agenda/configuracion" element={<AgendaConfigPage />} />
                <Route path="agenda/turnos" element={<TurnosManagePage />} />
            </Route>

            {/* --- Panel Paciente --- */}
            {/* Usando PacienteLayout existente para anidar rutas */}
            <Route
                path="/panel/paciente"
                element={<PacienteRoute><PacienteLayout /></PacienteRoute>}
            >
                <Route index element={<DashboardPaciente />} /> {/* Dashboard como ruta índice */}
                {/* ¡NUEVAS Rutas Agenda Paciente! */}
                <Route path="agenda/solicitar" element={<TurnosViewPage />} />
                <Route path="agenda/mis-turnos" element={<MisTurnosPage />} /> {/* Ruta opcional */}
                {/* Otras rutas de paciente pueden ir aquí */}
            </Route>

            {/* Ruta Catch-all */}
            {/* <Route path="*" element={<Error404 />} /> Podrías añadir una página 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} /> {/* O redirigir al login */}
        </Routes>
    );
}