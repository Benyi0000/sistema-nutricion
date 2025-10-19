import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { fetchMe } from '../../features/auth/authSlice';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

function ConfiguracionAdmin() {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
    });
    const [linkingStatus, setLinkingStatus] = useState('idle');
    const [linkingError, setLinkingError] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Usamos el endpoint de Djoser para el usuario actual
            const response = await api.patch('/auth/users/me/', formData);
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
            // Este endpoint es el mismo para desconectar la cuenta
            const response = await api.post('/api/user/disconnect/google-oauth2/');
            if (response.status === 200) {
                googleLogout();
                dispatch(fetchMe());
                alert('Cuenta de Google desvinculada con éxito.');
            } else {
                alert(`Error al desvincular: ${JSON.stringify(response.data || {})}`);
            }
        } catch (error) {
            console.error('Error during Google account disconnection:', error);
            alert(`Ocurrió un error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
        }
    };

    // La cuenta de Google se obtiene del mismo lugar en el estado del usuario
    const googleAccount = user?.google_account;

    return (
        <div className="space-y-8">
            {/* Formulario de Información Personal */}
            <div className="p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Información Personal</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="dni" className="block text-sm font-medium text-gray-700">DNI</label>
                            <input type="text" name="dni" id="dni" value={user?.dni || ''} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" id="email" value={user?.email || ''} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Guardar Cambios</button>
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
                                disabled={linkingStatus === 'loading'}
                                className={`px-4 py-2 text-white rounded ${
                                    linkingStatus === 'loading' 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                                {linkingStatus === 'loading' ? 'Vinculando...' : 'Vincular cuenta de Google'}
                            </button>
                        )}
                    </div>
                    {linkingError && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{linkingError}</p>
                        </div>
                    )}
                    {linkingStatus === 'success' && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-600">¡Cuenta vinculada exitosamente!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ConfiguracionAdmin;
