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
                <th className="p-2">Última consulta</th>
                <th className="p-2"></th>
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
                <tr key={p.id} className="border-t">
                    <td className="p-2">{p.dni}</td>
                    <td className="p-2">
                    {p.nombre} {p.apellido}
                    </td>
                    <td className="p-2">{p.edad || "-"}</td>
                    <td className="p-2">{p.telefono || "-"}</td>
                    <td className="p-2">
                    <Link
                        to={`/panel/nutri/seguimientos/${p.id}`}
                        className="text-indigo-600 hover:underline"
                    >
                        Ver seguimientos
                    </Link>
                    </td>
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    );
}
