import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/auth';
import { nutritionistsAPI } from '../../lib/api';
import Layout from '../../hocs/layouts/Layout';
import ProfileSettings from '../../components/profile/ProfileSettings';

function AdminDashboard() {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [nutritionists, setNutritionists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedNutritionist, setSelectedNutritionist] = useState(null);
    const [formData, setFormData] = useState({
        dni: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        is_staff: true
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [showProfileSettings, setShowProfileSettings] = useState(false);

    useEffect(() => {
        loadNutritionists();
    }, []);

    const loadNutritionists = async () => {
        try {
            setLoading(true);
            const response = await nutritionistsAPI.list();
            setNutritionists(response.data);
        } catch (error) {
            setError('Error al cargar nutricionistas');
            console.error('Error loading nutritionists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    const resetForm = () => {
        setFormData({
            dni: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            address: '',
            is_staff: true
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateNutritionist = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const response = await nutritionistsAPI.create(formData);
            setShowCreateModal(false);
            resetForm();
            loadNutritionists();
            
            // Mostrar contraseña temporal si se generó
            if (response.data.temp_password) {
                alert(`Nutricionista creado exitosamente.\nContraseña temporal: ${response.data.temp_password}`);
            }
        } catch (error) {
            console.error('Error creating nutritionist:', error);
            setModalError('Error al crear nutricionista: ' + (error.response?.data?.message || 'Error desconocido'));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEditNutritionist = (nutritionist) => {
        setSelectedNutritionist(nutritionist);
        setFormData({
            dni: nutritionist.dni || '',
            first_name: nutritionist.first_name || '',
            last_name: nutritionist.last_name || '',
            email: nutritionist.email || '',
            phone: nutritionist.phone || '',
            address: nutritionist.address || '',
            is_staff: nutritionist.is_staff || true
        });
        setShowEditModal(true);
    };

    const handleUpdateNutritionist = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            await nutritionistsAPI.update(selectedNutritionist.id, formData);
            setShowEditModal(false);
            resetForm();
            setSelectedNutritionist(null);
            loadNutritionists();
        } catch (error) {
            console.error('Error updating nutritionist:', error);
            setModalError('Error al actualizar nutricionista: ' + (error.response?.data?.message || 'Error desconocido'));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteNutritionist = async (nutritionist) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar al nutricionista ${nutritionist.first_name} ${nutritionist.last_name}?`)) {
            try {
                await nutritionistsAPI.delete(nutritionist.id);
                loadNutritionists();
            } catch (error) {
                console.error('Error deleting nutritionist:', error);
                setError('Error al eliminar nutricionista: ' + (error.response?.data?.message || 'Error desconocido'));
            }
        }
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        resetForm();
        setModalError('');
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        resetForm();
        setSelectedNutritionist(null);
        setModalError('');
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                    {user?.profile_photo ? (
                                        <img 
                                            src={user.profile_photo} 
                                            alt={`${user.first_name} ${user.last_name}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #dc2626, #b91c1c)'}}>
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        Dashboard Administrador
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        Bienvenido/a, {user?.first_name} {user?.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setShowProfileSettings(true)}
                                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Mi Perfil
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Total Nutricionistas</p>
                                        <p className="text-2xl font-semibold text-gray-900">{nutritionists.length}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Nutricionistas Activos</p>
                                        <p className="text-2xl font-semibold text-gray-900">{nutritionists.filter(n => n.is_active).length}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Registros Este Mes</p>
                                        <p className="text-2xl font-semibold text-gray-900">0</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nutritionists Management Section */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-900">
                                        Gestión de Nutricionistas
                                    </h2>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        + Nuevo Nutricionista
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                {loading ? (
                                    <div className="text-center py-8">
                                        <svg className="animate-spin h-8 w-8 mx-auto text-red-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="mt-2 text-gray-600">Cargando nutricionistas...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-8">
                                        <div className="text-red-600 mb-2">
                                            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-red-600">{error}</p>
                                        <button
                                            onClick={loadNutritionists}
                                            className="mt-2 text-red-600 hover:text-red-800 transition-colors"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                ) : nutritionists.length === 0 ? (
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin nutricionistas</h3>
                                        <p className="text-gray-600 mb-4">Comienza agregando tu primer nutricionista</p>
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            + Agregar Nutricionista
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Nutricionista
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        DNI
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Contacto
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Estado
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Fecha Registro
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Acciones
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {nutritionists.map((nutritionist) => (
                                                    <tr key={nutritionist.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {nutritionist.first_name?.[0]}{nutritionist.last_name?.[0]}
                                                                    </span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {nutritionist.first_name} {nutritionist.last_name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {nutritionist.dni}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            <div>{nutritionist.phone}</div>
                                                            <div className="text-gray-500">{nutritionist.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                nutritionist.is_active 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {nutritionist.is_active ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {new Date(nutritionist.date_joined).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button 
                                                                onClick={() => handleEditNutritionist(nutritionist)}
                                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteNutritionist(nutritionist)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal para crear nutricionista */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Nutricionista</h3>
                            <button
                                onClick={closeCreateModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {modalError && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error al crear nutricionista</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{modalError}</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto pl-3">
                                        <div className="-mx-1.5 -my-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setModalError('')}
                                                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                                            >
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <form onSubmit={handleCreateNutritionist}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <h4 className="text-md font-medium text-red-700 mb-3">Información del Nutricionista</h4>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                                    <input
                                        type="text"
                                        name="dni"
                                        value={formData.dni}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="12345678"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="nutricionista@email.com"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Dr. María"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Nutricionista"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="+54 9 11 1234-5678"
                                        required
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Av. Corrientes 1234, CABA"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md transition-colors"
                                >
                                    {submitLoading ? 'Creando...' : 'Crear Nutricionista'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal para editar nutricionista */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Editar Nutricionista</h3>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {modalError && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error al actualizar nutricionista</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{modalError}</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto pl-3">
                                        <div className="-mx-1.5 -my-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setModalError('')}
                                                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                                            >
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <form onSubmit={handleUpdateNutritionist}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <h4 className="text-md font-medium text-red-700 mb-3">Información del Nutricionista</h4>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                                    <input
                                        type="text"
                                        name="dni"
                                        value={formData.dni}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                                        readOnly
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md transition-colors"
                                >
                                    {submitLoading ? 'Actualizando...' : 'Actualizar Nutricionista'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Settings Modal */}
            {showProfileSettings && (
                <ProfileSettings 
                    onClose={() => setShowProfileSettings(false)}
                    onUpdateProfile={() => {
                        console.log('Profile updated successfully');
                    }}
                />
            )}
        </Layout>
    );
}

export default AdminDashboard;
