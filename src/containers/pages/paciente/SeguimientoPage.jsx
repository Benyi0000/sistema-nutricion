// src/containers/pages/paciente/SeguimientoPage.jsx

export default function SeguimientoPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Mi Seguimiento</h1>
            <p className="text-gray-600">
                Aquí podrás ver tu progreso y seguimiento nutricional.
            </p>
            <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-500">No hay datos de seguimiento todavía.</p>
            </div>
        </div>
    );
}
