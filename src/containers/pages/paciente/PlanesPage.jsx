// src/containers/pages/paciente/PlanesPage.jsx

export default function PlanesPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Planes Nutricionales</h1>
            <p className="text-gray-600">
                Aquí podrás ver tus planes nutricionales personalizados.
            </p>
            <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-500">No tienes planes asignados todavía.</p>
            </div>
        </div>
    );
}
