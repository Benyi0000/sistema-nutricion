import Layout from './Layout';
import SidebarPaciente from '../../components/navigation/sidebars/SidebarPaciente';

export default function PacienteLayout({ children }) {
    return <Layout SidebarComponent={SidebarPaciente}>{children}</Layout>;
}
