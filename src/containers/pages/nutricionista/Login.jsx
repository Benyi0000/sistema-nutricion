// src/containers/pages/nutricionista/Login.jsx
import { LockClosedIcon } from '@heroicons/react/20/solid';
import { useState, useEffect, useRef } from 'react'; // <-- Add useRef
import { useDispatch, useSelector } from 'react-redux';
import { login, fetchMe } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client'; // <-- Import your API client

// --- USE GOOGLE CLIENT ID FROM ENV ---
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { access, user, status, error } = useSelector(s => s.auth);
    const googleButtonDiv = useRef(null); // Ref for the Google button container

    const [formData, setForm] = useState({
        dni: '',
        password: ''
    });
    const [googleStatus, setGoogleStatus] = useState('idle'); // 'idle', 'loading', 'failed'
    const [googleError, setGoogleError] = useState(null);

    const { dni, password } = formData;

    const onChange = (e) =>
        setForm({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!dni || !password || status === 'loading') return;
        try {
            // Use unwrap to handle potential rejections from createAsyncThunk
            await dispatch(login({ dni, password })).unwrap();
            // Fetch user data only after successful login
            // await dispatch(fetchMe()); // fetchMe might be called by useEffect below
        } catch (loginError) {
             console.error("Login failed:", loginError);
            // Error is already handled by the authSlice and displayed below
        }
    };

    // --- GOOGLE SIGN-IN HANDLER ---
    const handleGoogleSignIn = async (response) => {
        setGoogleStatus('loading');
        setGoogleError(null);
        console.log("Google Sign-In credential:", response.credential);

        try {
            // Send the Google token ('credential') to your Djoser backend endpoint
            const res = await api.post('/auth/o/google-oauth2/', {
                access_token: response.credential // Djoser expects it as access_token for JWTs from Google ID tokens
            });

            // Backend returns your app's access and refresh tokens
            const { access: appAccess, refresh: appRefresh } = res.data;
            localStorage.setItem('access', appAccess);
            localStorage.setItem('refresh', appRefresh);
            api.defaults.headers.common.Authorization = `JWT ${appAccess}`; // Update api client headers

            // Fetch user data using the new token
            await dispatch(fetchMe()).unwrap();
            setGoogleStatus('succeeded');
            // Redirection logic will be handled by the useEffect below

        } catch (err) {
            console.error("Google Sign-In backend error:", err);
            setGoogleStatus('failed');
            setGoogleError(err.response?.data?.detail || err.message || 'Error al iniciar sesión con Google.');
        }
    };

    // --- RENDER GOOGLE BUTTON ---
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.error("VITE_GOOGLE_CLIENT_ID is not set in .env file.");
            return;
        }
        if (window.google && window.google.accounts && window.google.accounts.id && googleButtonDiv.current) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleSignIn // Use the handler defined above
            });
            window.google.accounts.id.renderButton(
                googleButtonDiv.current, // Render the button in the ref container
                { theme: "outline", size: "large", text: "signin_with", shape: "rectangular", width: "300" } // Customize button appearance
            );
            // Optional: Prompt one tap login UI
            // window.google.accounts.id.prompt();
        } else {
             console.warn("Google Identity Services not ready or button container not found.");
        }
    }, []); // Run only once on mount

    // --- REDIRECTION LOGIC (Keep as is) ---
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
            // Determine role based on your UserDetailSerializer logic
            const role = user.role || (user.is_staff ? 'admin' : (user.nutricionista ? 'nutricionista' : (user.paciente ? 'paciente' : null)));

            if (role === 'admin') navigate('/panel/admin', { replace: true });
            else if (role === 'nutricionista') navigate('/panel/nutri', { replace: true });
            else if (role === 'paciente') navigate('/panel/paciente', { replace: true });
            else navigate('/login', { replace: true }); // Fallback if role is unclear
        }
    }, [access, user, navigate]);


    return (
        <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <img
                        className="mx-auto h-12 w-auto"
                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                        alt="NutriSalud" // Updated Alt Text
                    />
                     <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Ingresa a tu cuenta
                    </h2>
                </div>

                {/* DNI/Password Form */}
                <form onSubmit={onSubmit} className="mt-8 space-y-6">
                    {/* ... (inputs for dni and password remain the same) ... */}
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
                    {/* ... (Forgot password link remains the same) ... */}
                     <div className="flex items-center justify-between">
                        <div className="text-sm">
                        {/* Consider implementing password recovery */}
                        {/* <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                            ¿Olvidaste tu contraseña?
                        </a> */}
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

                {/* Separator */}
                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-gray-500">O continúa con</span>
                    </div>
                </div>

                {/* Google Sign-In Button Container */}
                <div className="flex justify-center">
                   <div ref={googleButtonDiv}></div>
                </div>
                 {googleStatus === 'loading' && <p className="text-gray-500 text-sm text-center mt-2">Iniciando sesión con Google...</p>}
                 {googleStatus === 'failed' && <p className="text-red-600 text-sm text-center mt-2">{googleError || 'Error al iniciar sesión con Google.'}</p>}

            </div>
        </div>
    );
}
export default Login;