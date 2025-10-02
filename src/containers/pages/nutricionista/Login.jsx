import { LockClosedIcon } from '@heroicons/react/20/solid'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login, fetchMe } from '../../../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { access, user, status, error } = useSelector(s => s.auth);

    const [formData, setForm] = useState({
        dni: '',
        password: ''
    });

    const { dni, password } = formData;

    const onChange = (e) =>
        setForm({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!dni || !password || status === 'loading') return;
        await dispatch(login({ dni, password }));
        await dispatch(fetchMe());
    };

    // Si ya hay token pero no tenemos user, traemos /auth/users/me/
    useEffect(() => {
        if (access && !user) dispatch(fetchMe());
    }, [access]);

    // Redirección obligatoria si debe cambiar contraseña; si no, redirige por rol
    useEffect(() => {
        if (access && user) {
        if (user.must_change_password) {
            navigate('/cambiar-clave', { replace: true });
            return;
        }
        const role = user.role || (user.is_staff ? 'admin' : 'nutricionista');
        if (role === 'admin') navigate('/panel/admin', { replace: true });
        else if (role === 'nutricionista') navigate('/panel/nutri', { replace: true });
        else if (role === 'paciente') navigate('/panel/paciente', { replace: true });
        else navigate('/login', { replace: true });
        }
    }, [access, user]);

    return (
        <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
            <div>
            <img
                className="mx-auto h-12 w-auto"
                src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                alt="Your Company"
            />
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-6" action="#" method="POST">
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="-space-y-px rounded-md shadow-sm">
                <div>
                <label htmlFor="dni" className="sr-only">DNI</label>
                <input
                    id="dni"
                    name="dni"
                    value={dni}
                    onChange={onChange}
                    type="text"
                    required
                    autoComplete="username"
                    className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="DNI"
                />
                </div>
                <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    type="password"
                    required
                    autoComplete="current-password"
                    className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="Password"
                />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                </a>
                </div>
            </div>

            <div>
                <button
                type="submit"
                disabled={status === 'loading'}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockClosedIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
                </span>
                {status === 'loading' ? 'Ingresando…' : 'Sign in'}
                </button>
            </div>

            {status === 'failed' && <p className="text-red-600 text-sm">Credenciales inválidas</p>}
            {error && <p className="text-red-600 text-sm">{String(error)}</p>}
            </form>
        </div>
        </div>
    )
}
export default Login;
