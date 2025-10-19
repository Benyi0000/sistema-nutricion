import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { fetchMe } from '../../features/auth/authSlice';

function ConfiguracionUsuario() {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        matricula: '',
        telefono: '',
    });

    useEffect(() => {
        if (user && user.nutricionista) {
            setFormData({
                nombre: user.nutricionista.nombre || '',
                apellido: user.nutricionista.apellido || '',
                matricula: user.nutricionista.matricula || '',
                telefono: user.nutricionista.telefono || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.patch('/api/user/nutricionistas/me/', formData);
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

    const handleLinkGoogle = () => {
        const redirectUri = window.location.href; // Redirect back to the current page
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/login/google-oauth2/?next=${encodeURIComponent(redirectUri)}`;
    };

    const handleUnlinkGoogle = async () => {
        try {
            const response = await api.post('/auth/disconnect/google-oauth2/');

            if (response.status === 200) {
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
                            <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="apellido" id="apellido" value={formData.apellido} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="matricula" className="block text-sm font-medium text-gray-700">Matrícula</label>
                            <input type="text" name="matricula" id="matricula" value={formData.matricula} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input type="text" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
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
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Vincular cuenta de Google
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfiguracionUsuario;
