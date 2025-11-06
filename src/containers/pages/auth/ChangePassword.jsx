import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../../api/client';
import { fetchMe } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(s => s.auth);

    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        re_new_password: '',
    });
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);

    const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading'); setError(null);
        try {
        // 1) Cambiar contraseña con Djoser
        await api.post('/auth/users/set_password/', form);
        // 2) Marcar que ya no es obligatorio cambiarla
        await api.post('/api/user/me/password_changed/', {});
        // 3) Refrescar user y redirigir por rol
        await dispatch(fetchMe());
        const role = (user?.role) || (user?.is_staff ? 'admin' : 'nutricionista');
        if (role === 'admin') navigate('/panel/admin', { replace: true });
        else if (role === 'nutricionista') navigate('/panel/nutri', { replace: true });
        else navigate('/panel/paciente', { replace: true });
        } catch (err) {
        setError(err?.response?.data || { detail: 'Error al cambiar contraseña' });
        } finally {
        setStatus('idle');
        }
    };

    const fieldError = (k) => {
        if (!error || typeof error !== 'object') return null;
        const v = error[k];
        if (!v) return null;
        return Array.isArray(v) ? v.join(', ') : String(v);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
            <h1 className="text-xl font-semibold mb-4">Cambiar contraseña</h1>
            <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <input
                className="border p-2 rounded w-full"
                type="password"
                name="current_password"
                placeholder="Contraseña actual"
                value={form.current_password}
                onChange={onChange}
                required
                />
                {fieldError('current_password') && <p className="text-red-600 text-xs mt-1">{fieldError('current_password')}</p>}
            </div>
            <div>
                <input
                className="border p-2 rounded w-full"
                type="password"
                name="new_password"
                placeholder="Nueva contraseña (mín. 8)"
                value={form.new_password}
                onChange={onChange}
                required
                minLength={8}
                />
                {fieldError('new_password') && <p className="text-red-600 text-xs mt-1">{fieldError('new_password')}</p>}
            </div>
            <div>
                <input
                className="border p-2 rounded w-full"
                type="password"
                name="re_new_password"
                placeholder="Repetir nueva contraseña"
                value={form.re_new_password}
                onChange={onChange}
                required
                minLength={8}
                />
                {fieldError('re_new_password') && <p className="text-red-600 text-xs mt-1">{fieldError('re_new_password')}</p>}
            </div>

            <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 w-full"
            >
                {status === 'loading' ? 'Guardando…' : 'Guardar contraseña'}
            </button>

            {error?.detail && <p className="text-red-600 text-sm mt-2">{String(error.detail)}</p>}
            </form>
        </div>
        </div>
    );
}
