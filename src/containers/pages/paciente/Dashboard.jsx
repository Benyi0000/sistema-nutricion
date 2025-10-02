import PacienteLayout from '../../../hocs/layouts/PacienteLayout';
import Navbar from '../../../components/navigation/Navbar';
import Footer from '../../../components/navigation/Footer';

export default function DashboardPaciente() {
    return (
        <PacienteLayout>
        <Navbar />
        <div className="pt-28 min-h-screen">Dashboard Paciente</div>
        <Footer />
        </PacienteLayout>
    );
}
