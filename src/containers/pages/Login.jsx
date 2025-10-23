import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../../redux/actions/auth';
import Layout from '../../hocs/layouts/Layout';

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, user } = useSelector(state => state.auth);
    
    const [formData, setFormData] = useState({
        dni: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Si ya está logueado, redirigir al dashboard correspondiente
        if (isAuthenticated && user) {
            console.log('User data:', user);
            console.log('is_superuser:', user.is_superuser);
            console.log('role:', user.role);
            
            if (user.is_superuser) {
                console.log('Redirecting to admin dashboard');
                navigate('/dashboard/admin');
            } else if (user.role === 'nutricionista') {
                console.log('Redirecting to nutritionist dashboard');
                navigate('/dashboard/nutri');
            } else if (user.role === 'paciente') {
                console.log('Redirecting to patient dashboard');
                navigate('/dashboard/paciente');
            }
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        // Limpiar errores al montar el componente
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Limpiar error al escribir
        if (error) {
            dispatch(clearError());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.dni || !formData.password) {
            return;
        }

        const result = await dispatch(login(formData));
        if (!result.success) {
            console.log('Login failed:', result.error);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{background: 'linear-gradient(to bottom right, #f3f0ff, #e8ddf5)'}}>
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <div className="mx-auto flex justify-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #b39ddb, #9575cd)'}}>
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Inicia Sesión
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Sistema de Gestión Nutricional
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="dni" className="sr-only">
                                    DNI
                                </label>
                                <input
                                    id="dni"
                                    name="dni"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:z-10 sm:text-sm"
                                    style={{'--tw-ring-color': '#9575cd'}}
                                    onFocus={e => {e.target.style.borderColor = '#9575cd'; e.target.style.boxShadow = '0 0 0 3px rgba(149, 117, 205, 0.1)';}}
                                    onBlur={e => {e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none';}}
                                    placeholder="DNI (8 dígitos)"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    maxLength={8}
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:z-10 sm:text-sm"
                                    style={{'--tw-ring-color': '#9575cd'}}
                                    onFocus={e => {e.target.style.borderColor = '#9575cd'; e.target.style.boxShadow = '0 0 0 3px rgba(149, 117, 205, 0.1)';}}
                                    onBlur={e => {e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none';}}
                                    placeholder="Contraseña"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        {showPassword ? (
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                        ) : (
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        )}
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Error de autenticación
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <Link
                                to="/auth/forgot-password"
                                className="text-sm transition-colors"
                                style={{color: '#9575cd'}}
                                onMouseEnter={e => e.target.style.color = '#7e5cc0'}
                                onMouseLeave={e => e.target.style.color = '#9575cd'}
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || !formData.dni || !formData.password}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{backgroundColor: '#b39ddb', '--tw-ring-color': '#9575cd'}}
                                onMouseEnter={e => !e.target.disabled && (e.target.style.backgroundColor = '#9575cd')}
                                onMouseLeave={e => !e.target.disabled && (e.target.style.backgroundColor = '#b39ddb')}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link
                                to="/"
                                className="text-sm text-gray-600 transition-colors"
                                onMouseEnter={e => e.target.style.color = '#9575cd'}
                                onMouseLeave={e => e.target.style.color = '#6b7280'}
                            >
                                ← Volver al inicio
                            </Link>
                        </div>
                    </form>

                    {/* Información de prueba para desarrollo */}
                    {import.meta.env.DEV && (
                        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <h4 className="text-sm font-medium text-yellow-800 mb-2">Datos de prueba:</h4>
                            <div className="text-xs text-yellow-700 space-y-1">
                                <p><strong>Nutricionista:</strong> DNI: 12345678, Pass: nutri123</p>
                                <p><strong>Paciente:</strong> DNI: 20123456, Pass: paciente123</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default Login;