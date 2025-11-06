import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { fetchMe } from '../../features/auth/authSlice';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

function ConfiguracionPaciente() {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        genero: '',
        telefono: '',
    });
    const [linkingStatus, setLinkingStatus] = useState('idle');
    const [linkingError, setLinkingError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchMe());
    }, [dispatch]);

    useEffect(() => {
        if (user && user.paciente) {
            setFormData({
                nombre: user.paciente.nombre || '',
                apellido: user.paciente.apellido || '',
                fecha_nacimiento: user.paciente.fecha_nacimiento || '',
                genero: user.paciente.genero || '',
                telefono: user.paciente.telefono || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await api.patch('/api/user/pacientes/me/', formData);
            if (response.status === 200) {
                dispatch(fetchMe());
                alert('Perfil actualizado con éxito.');
            } else {
                const errorData = response.data || {};
                alert(`Error al actualizar: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Ocurrió un error al actualizar el perfil: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLinkGoogleSuccess = async (tokenResponse) => {
        setLinkingStatus('loading');
        setLinkingError(null);
        
        console.log('Google token recibido:', tokenResponse);
        
        try {
            const response = await api.post('/api/user/link-google/', {
                access_token: tokenResponse.access_token
            });
            
            if (response.status === 200) {
                dispatch(fetchMe());
                setLinkingStatus('success');
                alert(response.data.message || 'Cuenta de Google vinculada con éxito.');
            }
        } catch (error) {
            console.error('Error linking Google account:', error);
            setLinkingStatus('failed');
            const errorMsg = error.response?.data?.error || error.message || 'Error al vincular cuenta de Google';
            setLinkingError(errorMsg);
            alert(errorMsg);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleLinkGoogleSuccess,
        onError: (error) => {
            console.error("Google Sign-In Error during linking:", error);
            setLinkingStatus('failed');
            setLinkingError('Hubo un problema con la autenticación de Google.');
            alert('Hubo un problema con la autenticación de Google.');
        }
    });

    const handleLinkGoogle = () => {
        console.log('Intentando vincular Google...');
        try {
            googleLogin();
        } catch (error) {
            console.error('Error al llamar googleLogin:', error);
            alert('Error al iniciar el proceso de vinculación');
        }
    };

    const handleUnlinkGoogle = async () => {
        try {
            const response = await api.post('/api/user/disconnect/google-oauth2/');

            if (response.status === 200) {
                googleLogout();
                dispatch(fetchMe());
                alert('Cuenta de Google desvinculada con éxito.');
            } else {
                const errorData = response.data || {};
                alert(`Error al desvincular: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error during Google account disconnection:', error);
            const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Ocurrió un error al intentar desvincular la cuenta: ${errorMessage}`);
        }
    };

    const googleAccount = user?.google_account;

    return (
        <div className="space-y-8">
            {/* Formulario de Información Personal */}
            <div className="p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Información Personal</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input 
                                type="text" 
                                name="nombre" 
                                id="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input 
                                type="text" 
                                name="apellido" 
                                id="apellido" 
                                value={formData.apellido} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                            <input 
                                type="date" 
                                name="fecha_nacimiento" 
                                id="fecha_nacimiento" 
                                value={formData.fecha_nacimiento} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                            />
                        </div>
                        <div>
                            <label htmlFor="genero" className="block text-sm font-medium text-gray-700">Género</label>
                            <select 
                                name="genero" 
                                id="genero" 
                                value={formData.genero} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            >
                                <option value="">Seleccionar...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="O">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input 
                                type="tel" 
                                name="telefono" 
                                id="telefono" 
                                value={formData.telefono} 
                                onChange={handleChange} 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                                placeholder="+54 9 11 xxxx-xxxx"
                            />
                        </div>
                        <div>
                            <label htmlFor="dni" className="block text-sm font-medium text-gray-700">DNI</label>
                            <input 
                                type="text" 
                                name="dni" 
                                id="dni" 
                                value={user?.dni || ''} 
                                readOnly 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm" 
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input 
                                type="email" 
                                name="email" 
                                id="email" 
                                value={user?.email || ''} 
                                readOnly 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm" 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Cuentas Vinculadas */}
            <div className="p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Cuentas Vinculadas</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-semibold">Cuenta de Google</p>
                            {googleAccount ? (
                                <p className="text-sm text-gray-600">
                                    Conectado como: {googleAccount.extra_data?.email || 'N/A'}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">No vinculada</p>
                            )}
                        </div>
                        {googleAccount ? (
                            <button
                                onClick={handleUnlinkGoogle}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Desvincular
                            </button>
                        ) : (
                            <button
                                onClick={handleLinkGoogle}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Vincular cuenta de Google
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Información del Nutricionista Asignado */}
            {user?.nutricionista_id && (
                <div className="p-6 bg-white shadow-md rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Mi Nutricionista</h2>
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Tienes un nutricionista asignado
                            </p>
                            <p className="text-sm text-gray-500">
                                Puedes agendar turnos y recibir seguimiento personalizado
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConfiguracionPaciente;
