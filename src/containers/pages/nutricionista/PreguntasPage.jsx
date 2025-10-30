// src/containers/pages/nutricionista/PreguntasPage.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    useGetPreguntasQuery, 
    useDeletePreguntaMutation 
} from '../../../features/preguntas/preguntasSlice';

const scopes = [
    { value: '', label: 'Todas' },
    { value: 'inicial', label: 'Inicial' },
    { value: 'seguimiento', label: 'Seguimiento' },
];

const tipos = [
    { value: '', label: 'Todos' },
    { value: 'text', label: 'Texto' },
    { value: 'integer', label: 'Entero' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'boolean', label: 'Sí/No' },
    { value: 'single', label: 'Opción única' },
    { value: 'multi', label: 'Opción múltiple' },
    { value: 'date', label: 'Fecha' },
];

export default function PreguntasPage() {
    const navigate = useNavigate();
    const [scope, setScope] = useState('');
    const [tipo, setTipo] = useState('');
    const { data: preguntas, isLoading, isFetching } = useGetPreguntasQuery({ scope: scope || undefined, tipo: tipo || undefined });
    const [deletePregunta, { isLoading: deleting }] = useDeletePreguntaMutation();
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const lista = useMemo(() => Array.isArray(preguntas) ? preguntas : [], [preguntas]);

    const handleDelete = async (id) => {
        if (!id) return;
        setPendingDeleteId(id);
    };

    const onConfirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            await deletePregunta(pendingDeleteId).unwrap();
            setPendingDeleteId(null);
        } catch (e) {
            console.error(e);
            alert('No se pudo eliminar la pregunta');
        }
    };

    return (
        <div className="p-4">
            {/* Modal de confirmación de eliminación */}
            {pendingDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setPendingDeleteId(null)}></div>
                    <div className="relative bg-white p-6 rounded-lg shadow-2xl w-full max-w-md mx-4 z-10">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmar eliminación</h2>
                        <p className="text-gray-700 mb-6">¿Eliminar esta pregunta? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setPendingDeleteId(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                            <button onClick={onConfirmDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-800">Banco de preguntas</h1>
                <div className="flex gap-2">
                    <Link to="/panel/nutri/plantillas/crear" className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Gestionar plantillas</Link>
                    <button onClick={() => navigate('/panel/nutri/preguntas/crear')} className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Nueva pregunta</button>
                </div>
            </div>

            <div className="bg-white border rounded-md p-3 mb-4 flex flex-wrap gap-3">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Scope</label>
                    <select className="border rounded px-2 py-1 text-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
                        {scopes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                    <select className="border rounded px-2 py-1 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                {(isFetching || isLoading) && <div className="text-sm text-gray-500 self-end">Cargando…</div>}
            </div>

            <div className="overflow-x-auto bg-white border rounded-md">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="text-left px-3 py-2">Texto</th>
                            <th className="text-left px-3 py-2">Tipo</th>
                            <th className="text-left px-3 py-2">Unidad</th>
                            <th className="text-left px-3 py-2">Scope</th>
                            <th className="text-left px-3 py-2">Origen</th>
                            <th className="text-right px-3 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No hay preguntas</td>
                            </tr>
                        )}
                        {lista.map((p) => (
                            <tr key={p.id} className="border-t border-gray-100">
                                <td className="px-3 py-2 max-w-xl">
                                    <div className="text-gray-900">{p.texto}</div>
                                    {Array.isArray(p.opciones) && p.opciones.length > 0 && (
                                        <div className="text-xs text-gray-500 truncate">Opciones: {p.opciones.map(o => o.etiqueta || o.valor).join(', ')}</div>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-gray-700">{p.tipo}</td>
                                <td className="px-3 py-2 text-gray-700">{p.unidad || '-'}</td>
                                <td className="px-3 py-2 text-gray-700">{p.scope || (p.es_inicial ? 'inicial' : p.es_seguimiento ? 'seguimiento' : '')}</td>
                                <td className="px-3 py-2 text-gray-700">{p.es_personalizada ? 'Personalizada' : 'Sistema'}</td>
                                <td className="px-3 py-2 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/panel/nutri/preguntas/${p.id}/editar`)}
                                            className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-50"
                                            disabled={!p.es_personalizada}
                                            title={!p.es_personalizada ? 'Solo preguntas personalizadas se pueden editar' : ''}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            disabled={deleting || !p.es_personalizada}
                                            onClick={() => handleDelete(p.id)}
                                            className="px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                                            title={!p.es_personalizada ? 'Solo preguntas personalizadas se pueden eliminar' : ''}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


