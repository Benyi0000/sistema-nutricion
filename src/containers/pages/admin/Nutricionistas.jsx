import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { crearNutricionista } from '../../../features/nutri/nutriAdminSlice';

export default function NutricionistasAdmin() {
    const dispatch = useDispatch();
    const { status, error, lastCreated } = useSelector(s => s.nutriAdmin);

    const [form, setForm] = useState({
        dni: '', email: '', first_name: '', last_name: '',
        password: '', matricula: '', telefono: '',
        especialidades_raw: '' // "1,2,3"
    });

    const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        const payload = {
        dni: form.dni,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
        matricula: form.matricula,
        telefono: form.telefono,
        };
        const ids = String(form.especialidades_raw || '')
        .split(',')
        .map(s => s.trim()).filter(Boolean)
        .map(n => Number(n)).filter(Number.isInteger);
        if (ids.length) payload.especialidades_ids = ids;

        await dispatch(crearNutricionista(payload));
    };

    const fieldError = (name) => {
        if (!error || typeof error !== 'object') return null;
        const v = error[name];
        if (!v) return null;
        return Array.isArray(v) ? v.join(', ') : String(v);
    };

    return (
        <div className="space-y-4">
        <h2 className="text-xl font-semibold">Alta de Nutricionista</h2>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div>
            <input className="border p-2 rounded w-full" name="dni" placeholder="DNI"
                    value={form.dni} onChange={onChange} required />
            {fieldError('dni') && <p className="text-red-600 text-xs mt-1">{fieldError('dni')}</p>}
            </div>

            <div>
            <input className="border p-2 rounded w-full" name="email" type="email" placeholder="Email"
                    value={form.email} onChange={onChange} required />
            {fieldError('email') && <p className="text-red-600 text-xs mt-1">{fieldError('email')}</p>}
            </div>

            <div>
            <input className="border p-2 rounded w-full" name="first_name" placeholder="Nombre"
                    value={form.first_name} onChange={onChange} required />
            {fieldError('first_name') && <p className="text-red-600 text-xs mt-1">{fieldError('first_name')}</p>}
            </div>

            <div>
            <input className="border p-2 rounded w-full" name="last_name" placeholder="Apellido"
                    value={form.last_name} onChange={onChange} required />
            {fieldError('last_name') && <p className="text-red-600 text-xs mt-1">{fieldError('last_name')}</p>}
            </div>

            <div>
            <input className="border p-2 rounded w-full" name="password" type="password"
                    placeholder="Contraseña inicial" value={form.password} onChange={onChange}
                    required minLength={8} />
            {fieldError('password') && <p className="text-red-600 text-xs mt-1">{fieldError('password')}</p>}
            </div>

            <div>
            <input className="border p-2 rounded w-full" name="matricula" placeholder="Matrícula (opcional)"
                    value={form.matricula} onChange={onChange} />
            {fieldError('matricula') && <p className="text-red-600 text-xs mt-1">{fieldError('matricula')}</p>}
            </div>

            <div>
            <input className="border p-2 rounded w-full" name="telefono" placeholder="Teléfono (opcional)"
                    value={form.telefono} onChange={onChange} />
            {fieldError('telefono') && <p className="text-red-600 text-xs mt-1">{fieldError('telefono')}</p>}
            </div>

            <div className="md:col-span-2">
            <input className="border p-2 rounded w-full" name="especialidades_raw"
                    placeholder="IDs de especialidad separados por coma (opcional)"
                    value={form.especialidades_raw} onChange={onChange} />
            {fieldError('especialidades_ids') && <p className="text-red-600 text-xs mt-1">{fieldError('especialidades_ids')}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
            <button
                type="submit"
                disabled={status==='loading'}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
                {status==='loading' ? 'Creando…' : 'Crear nutricionista'}
            </button>
            </div>
        </form>

        {status === 'failed' && typeof error === 'string' && (
            <p className="text-red-600">{error}</p>
        )}
        {lastCreated && (
            <p className="text-green-700">
            Creado OK — user_id: {lastCreated.user_id}, nutricionista_id: {lastCreated.nutricionista_id}
            </p>
        )}
        </div>
    );
}
