import { LockClosedIcon } from '@heroicons/react/20/solid';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, fetchMe, setTokens } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import { useGoogleLogin } from '@react-oauth/google';

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

    const handleGoogleSignIn = async (tokenResponse) => {
        setGoogleStatus('loading');
        setGoogleError(null);
        console.log("Google Sign-In token response:", tokenResponse);

        try {
            // Envía el access_token a nuestro endpoint personalizado
            console.log("Enviando petición a /api/user/google-login/ con:", {
                access_token: tokenResponse.access_token.substring(0, 20) + "..."
            });
            
            const res = await api.post('/api/user/google-login/', {
                access_token: tokenResponse.access_token
            });

            console.log("Respuesta exitosa del backend:", res.data);
            
            const { access: appAccess, refresh: appRefresh } = res.data;
            localStorage.setItem('access', appAccess);
            localStorage.setItem('refresh', appRefresh);
            api.defaults.headers.common.Authorization = `JWT ${appAccess}`;

            // Actualizar el estado de Redux con los tokens
            dispatch(setTokens({ access: appAccess, refresh: appRefresh }));

            // Obtener información del usuario
            await dispatch(fetchMe()).unwrap();
            setGoogleStatus('succeeded');
            
            // La redirección se manejará automáticamente por el useEffect
        } catch (err) {
            console.error("Google Sign-In backend error:", err);
            console.error("Error response data:", err.response?.data);
            console.error("Error non_field_errors:", err.response?.data?.non_field_errors);
            console.error("Error response status:", err.response?.status);
            console.error("Error response headers:", err.response?.headers);
            setGoogleStatus('failed');
            setGoogleError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || err.message || 'Error al iniciar sesión con Google.');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSignIn,
        onError: () => {
            console.error("Google Sign-In Error");
            setGoogleStatus('failed');
            setGoogleError('Hubo un problema con la autenticación de Google.');
        }
    });

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

                <div className="flex justify-center">
                    <button
                        onClick={() => googleLogin()}
                        className="flex items-center justify-center w-full max-w-xs mx-auto bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c73.2 0 136.2 29.3 181.9 75.9L368.4 135.5c-29.9-28.6-69.9-46.6-124.4-46.6-94.3 0-171.3 76.9-171.3 171.3s77 171.3 171.3 171.3c108.5 0 143.2-85.4 148.8-124.3H244v-90.8h244z"></path>
                        </svg>
                        <span>Iniciar sesión con Google</span>
                    </button>
                </div>

                 {googleStatus === 'loading' && <p className="text-gray-500 text-sm text-center mt-2">Iniciando sesión con Google...</p>}
                 {googleStatus === 'failed' && <p className="text-red-600 text-sm text-center mt-2">{googleError}</p>}
            </div>
        </div>
    );
}

export default Login;

