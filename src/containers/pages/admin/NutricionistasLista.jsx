import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { fetchNutricionistas } from '../../../features/nutri/nutriListAdminSlice';
import { Link } from 'react-router-dom';

export default function NutricionistasLista() {
    const dispatch = useDispatch();
    const { items, count, num_pages, page, page_size, search, status, error } = useSelector(s => s.nutriList);
    const [term, setTerm] = useState(search);

    useEffect(() => {
        dispatch(fetchNutricionistas({ page: 1, page_size: 10, search: '' }));
    }, []);

    const onSubmit = (e) => {
        e.preventDefault();
        dispatch(fetchNutricionistas({ page: 1, page_size, search: term }));
    };

    const goPage = (p) => {
        if (p < 1 || (num_pages && p > num_pages)) return;
        dispatch(fetchNutricionistas({ page: p, page_size, search }));
    };

    return (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Nutricionistas</h2>
            <Link
            to="/panel/admin/nutricionistas/crear"
            className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
            Alta nutricionista
            </Link>
        </div>

        <form onSubmit={onSubmit} className="flex gap-2">
            <input
            className="border p-2 rounded w-full max-w-md"
            placeholder="Buscar por DNI, nombre, email, matrícula, especialidad..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            />
            <button
            type="submit"
            className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
            disabled={status==='loading'}
            >
            Buscar
            </button>
        </form>

        {status === 'failed' && (
            <div className="text-red-700">
            {typeof error === 'string' ? error : (error?.detail || 'Error al cargar')}
            </div>
        )}

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Especialidades</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {status === 'loading' && (
                <tr><td colSpan={6} className="px-3 py-4 text-sm text-gray-600">Cargando…</td></tr>
                )}
                {status !== 'loading' && items.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-sm text-gray-600">Sin resultados</td></tr>
                )}
                {items.map(n => (
                <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{n.dni}</td>
                    {/* --- MODIFICADO --- */}
                    {/* Usamos 'apellido' y 'nombre' en lugar de 'last_name' y 'first_name' */}
                    <td className="px-3 py-2 text-sm">{n.apellido}, {n.nombre}</td>
                    {/* --- FIN MODIFICADO --- */}
                    <td className="px-3 py-2 text-sm">{n.email}</td>
                    <td className="px-3 py-2 text-sm">{n.matricula || '-'}</td>
                    <td className="px-3 py-2 text-sm">{n.telefono || '-'}</td>
                    <td className="px-3 py-2 text-sm">
                    {n.especialidades?.length ? n.especialidades.join(', ') : '-'}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center gap-2">
            <button
            className="px-3 py-2 rounded border"
            onClick={() => goPage(page - 1)}
            disabled={page <= 1 || status==='loading'}
            >
            Anterior
            </button>
            <span className="text-sm text-gray-600">
            Página {page} {num_pages ? `de ${num_pages}` : ''}
            </span>
            <button
            className="px-3 py-2 rounded border"
            onClick={() => goPage(page + 1)}
            disabled={(num_pages && page >= num_pages) || status==='loading'}
            >
            Siguiente
            </button>
        </div>
        </div>
    );
}