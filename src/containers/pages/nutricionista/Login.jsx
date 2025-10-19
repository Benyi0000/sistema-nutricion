import { LockClosedIcon } from '@heroicons/react/20/solid';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, fetchMe } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import { GoogleLogin } from '@react-oauth/google'; // 1. Importa el componente de la librería

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { access, user, status, error } = useSelector(s => s.auth);

    const [formData, setForm] = useState({
        dni: '',
        password: ''
    });
    const [googleStatus, setGoogleStatus] = useState('idle');
    const [googleError, setGoogleError] = useState(null);

    const { dni, password } = formData;

    const onChange = (e) =>
        setForm({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!dni || !password || status === 'loading') return;
        try {
            await dispatch(login({ dni, password })).unwrap();
        } catch (loginError) {
            console.error("Login failed:", loginError);
        }
    };

    // --- MANEJADOR DE GOOGLE SIGN-IN SIMPLIFICADO ---
    // Esta función es llamada por el componente <GoogleLogin> en caso de éxito.
    const handleGoogleSignIn = async (credentialResponse) => {
        setGoogleStatus('loading');
        setGoogleError(null);
        console.log("Google Sign-In credential:", credentialResponse.credential);

        try {
            // Envía el token a tu endpoint de Djoser.
            // Djoser espera el token JWT de Google bajo la clave "access_token".
            const res = await api.post('/auth/o/google-oauth2/', {
                access_token: credentialResponse.credential 
            });

            const { access: appAccess, refresh: appRefresh } = res.data;
            localStorage.setItem('access', appAccess);
            localStorage.setItem('refresh', appRefresh);
            api.defaults.headers.common.Authorization = `JWT ${appAccess}`;

            await dispatch(fetchMe()).unwrap();
            setGoogleStatus('succeeded');
            // La redirección se maneja en el useEffect de abajo

        } catch (err) {
            console.error("Google Sign-In backend error:", err);
            setGoogleStatus('failed');
            setGoogleError(err.response?.data?.detail || err.message || 'Error al iniciar sesión con Google.');
        }
    };

    // --- Manejador para errores de Google ---
    const handleGoogleError = () => {
        console.error("Google Sign-In Error");
        setGoogleStatus('failed');
        setGoogleError('Hubo un problema con la autenticación de Google.');
    };

    // --- LÓGICA DE REDIRECCIÓN (sin cambios) ---
    useEffect(() => {
        if (access && !user && status !== 'loading') {
            dispatch(fetchMe());
        }
    }, [access, user, status, dispatch]);

    useEffect(() => {
        if (access && user) {
            if (user.must_change_password) {
                navigate('/cambiar-clave', { replace: true });
                return;
            }
            const role = user.role || (user.is_staff ? 'admin' : (user.nutricionista ? 'nutricionista' : (user.paciente ? 'paciente' : null)));

            if (role === 'admin') navigate('/panel/admin', { replace: true });
            else if (role === 'nutricionista') navigate('/panel/nutri', { replace: true });
            else if (role === 'paciente') navigate('/panel/paciente', { replace: true });
            else navigate('/login', { replace: true });
        }
    }, [access, user, navigate]);


    return (
        <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <img
                        className="mx-auto h-12 w-auto"
                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                        alt="NutriSalud"
                    />
                     <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Ingresa a tu cuenta
                    </h2>
                </div>

                <form onSubmit={onSubmit} className="mt-8 space-y-6">
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
                            {status === 'loading' ? 'Ingresando…' : 'Ingresar'}
                        </button>
                    </div>
                    {status === 'failed' && <p className="text-red-600 text-sm text-center mt-2">{error || 'Credenciales inválidas'}</p>}
                </form>

                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-gray-500">O continúa con</span>
                    </div>
                </div>

                {/* 2. Reemplaza el div manual con el componente GoogleLogin */}
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSignIn}
                        onError={handleGoogleError}
                        width="300"
                        text="signin_with"
                        shape="rectangular"
                        theme="outline"
                        size="large"
                    />
                </div>

                 {googleStatus === 'loading' && <p className="text-gray-500 text-sm text-center mt-2">Iniciando sesión con Google...</p>}
                 {googleStatus === 'failed' && <p className="text-red-600 text-sm text-center mt-2">{googleError}</p>}
            </div>
        </div>
    );
}

export default Login;

