import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPacientes } from "../../../features/nutri/nutriSlice";
import { Link } from "react-router-dom";

export default function PacientesList() {
    const dispatch = useDispatch();
    const { items: pacientes, status, error } = useSelector((s) => s.nutri);

    useEffect(() => {
        dispatch(fetchPacientes());
    }, [dispatch]);

    if (status === "loading")
        return <p className="text-gray-500">Cargando pacientes…</p>;

    if (status === "failed")
        return (
        <p className="text-red-600">
            {error?.detail || "Error al cargar pacientes"}
        </p>
        );

    return (
        <div>
        <h2 className="text-xl font-semibold mb-4">Pacientes</h2>
        <table className="w-full border text-sm">
            <thead>
            <tr className="bg-gray-100 text-left">
                <th className="p-2">DNI</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Edad</th>
                <th className="p-2">Teléfono</th>
                <th className="p-2">Acciones</th>
            </tr>
            </thead>
            <tbody>
            {pacientes.length === 0 ? (
                <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                    No hay pacientes asignados
                </td>
                </tr>
            ) : (
                pacientes.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{p.dni}</td>
                    <td className="p-2">
                    {p.nombre} {p.apellido}
                    </td>
                    <td className="p-2">{p.edad || "-"}</td>
                    <td className="p-2">{p.telefono || "-"}</td>
                    <td className="p-2">
                    <div className="flex gap-2">
                        <Link
                        to={`/panel/nutri/pacientes/${p.id}/historial`}
                        className="inline-flex items-center px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Ver Historial
                        </Link>
                        <Link
                        to={`/panel/nutri/seguimientos/${p.id}`}
                        className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Seguimiento
                        </Link>
                    </div>
                    </td>
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    );
}
