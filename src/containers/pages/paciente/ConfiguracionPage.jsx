// src/containers/pages/paciente/ConfiguracionPage.jsx
import ConfiguracionPaciente from "../../../components/EditPerfil/ConfiguracionPaciente";

export default function ConfiguracionPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración de la Cuenta</h1>
            <ConfiguracionPaciente />
        </div>
    );
}
