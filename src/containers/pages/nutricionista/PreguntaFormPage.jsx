// src/containers/pages/nutricionista/PreguntaFormPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useGetPreguntaQuery,
    useCreatePreguntaMutation,
    useUpdatePreguntaMutation,
} from '../../../features/preguntas/preguntasSlice';

const tipoOptions = [
    { value: 'text', label: 'Texto' },
    { value: 'integer', label: 'Entero' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'boolean', label: 'Sí/No' },
    { value: 'single', label: 'Opción única' },
    { value: 'multi', label: 'Opción múltiple' },
    { value: 'date', label: 'Fecha' },
];

const normalizeOpciones = (raw) => {
    if (!raw) return [];
    return String(raw)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((label) => ({ etiqueta: label, valor: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') }));
};

export default function PreguntaFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const { data: preguntaActual, isLoading: loadingPregunta } = useGetPreguntaQuery(id, { skip: !isEdit });
    const [createPregunta, { isLoading: creating }] = useCreatePreguntaMutation();
    const [updatePregunta, { isLoading: updating }] = useUpdatePreguntaMutation();

    const [form, setForm] = useState({
        texto: '',
        tipo: 'text',
        unidad: '',
        requerido: false,
        opcionesCsv: '',
        codigo: '',
    });

    useEffect(() => {
        if (preguntaActual && isEdit) {
            setForm({
                texto: preguntaActual.texto || '',
                tipo: preguntaActual.tipo || 'text',
                unidad: preguntaActual.unidad || '',
                requerido: !!preguntaActual.requerido,
                opcionesCsv: Array.isArray(preguntaActual.opciones) ? preguntaActual.opciones.map(o => o.etiqueta || o.valor).join(', ') : '',
                codigo: preguntaActual.codigo || '',
            });
        }
    }, [preguntaActual, isEdit]);

    const titulo = useMemo(() => isEdit ? 'Editar pregunta' : 'Nueva pregunta', [isEdit]);

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                texto: form.texto,
                tipo: form.tipo,
                unidad: form.unidad || undefined,
                requerido: !!form.requerido,
                codigo: form.codigo || undefined,
            };
            if (form.tipo === 'single' || form.tipo === 'multi') {
                payload.opciones = normalizeOpciones(form.opcionesCsv);
            }

            if (isEdit) {
                await updatePregunta({ id, ...payload }).unwrap();
            } else {
                await createPregunta(payload).unwrap();
            }
            navigate('/panel/nutri/preguntas');
        } catch (err) {
            console.error(err);
            alert('No se pudo guardar la pregunta');
        }
    };

    const busy = creating || updating || loadingPregunta;

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-800">{titulo}</h1>
                <Link to="/panel/nutri/preguntas" className="text-sm text-indigo-600 hover:underline">Volver al listado</Link>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border rounded-md p-4 grid gap-4 max-w-3xl">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Texto</label>
                    <input name="texto" value={form.texto} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Ej: ¿Tienes alergias?" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                        <select name="tipo" value={form.tipo} onChange={onChange} className="w-full border rounded px-3 py-2">
                            {tipoOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Unidad (opcional)</label>
                        <input name="unidad" value={form.unidad} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="kg, cm, veces/día" />
                    </div>
                    <div className="flex items-end gap-2">
                        <input id="req" type="checkbox" name="requerido" checked={form.requerido} onChange={onChange} className="h-4 w-4" />
                        <label htmlFor="req" className="text-sm text-gray-700">Requerida</label>
                    </div>
                </div>

                {(form.tipo === 'single' || form.tipo === 'multi') && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Opciones (separadas por coma)</label>
                        <input name="opcionesCsv" value={form.opcionesCsv} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Ej: Nunca, A veces, Siempre" />
                    </div>
                )}

                <div>
                    <label className="block text-xs text-gray-500 mb-1">Código (opcional)</label>
                    <input name="codigo" value={form.codigo} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Ej: actividad_fisica" />
                </div>

                <div className="flex justify-end gap-2">
                    <Link to="/panel/nutri/preguntas" className="px-4 py-2 rounded border">Cancelar</Link>
                    <button type="submit" disabled={busy} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">Guardar</button>
                </div>
            </form>
        </div>
    );
}


