import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/auth';
import Layout from '../../hocs/layouts/Layout';
import ProfileSettings from '../../components/profile/ProfileSettings';
import AppointmentCalendar from '../../components/appointments/AppointmentCalendar';
import MealPhotoUpload from '../../components/meals/MealPhotoUpload';
import { appointmentsAPI } from '../../lib/api';
import { formatLocalDate } from '../../utils/dateUtils';

function PacienteDashboard() {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [showProfileSettings, setShowProfileSettings] = useState(false);
    const [showAppointmentCalendar, setShowAppointmentCalendar] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleDateSelect = (date) => {
        console.log('Fecha seleccionada:', date);
    };

    const handleTimeSelect = (time) => {
        console.log('Hora seleccionada:', time);
    };

    // Cargar citas del paciente
    const loadAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const response = await appointmentsAPI.getPatientAppointments();
            setAppointments(response.data);
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const handleCloseCalendar = () => {
        setShowAppointmentCalendar(false);
        loadAppointments(); // Recargar citas después de cerrar el modal
    };

    // Cargar citas al montar el componente
    useEffect(() => {
        loadAppointments();
    }, []);

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
                                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        Mi Panel de Paciente
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        Bienvenido/a, {user?.first_name} {user?.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setShowProfileSettings(true)}
                                    className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
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
                        
                        {/* Welcome Section */}
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg p-8 text-white mb-8">
                            <h2 className="text-3xl font-bold mb-4">¡Bienvenido/a a tu panel!</h2>
                            <p className="text-lg opacity-90">
                                Aquí podrás ver tu plan nutricional, hacer seguimiento de tu progreso y acceder a todos tus datos.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Plan Nutricional</p>
                                        <p className="text-lg font-semibold text-gray-900">Activo</p>
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
                                        <p className="text-sm font-medium text-gray-500">Última Consulta</p>
                                        <p className="text-lg font-semibold text-gray-900">Pendiente</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Progreso</p>
                                        <p className="text-lg font-semibold text-gray-900">En seguimiento</p>
                                    </div>
                                </div>
                            </div>
                            
                            
                        </div>

                        {/* Agendar Turno - Sección Principal */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-xl p-8 text-white mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Agenda tu Consulta</h2>
                                        <p className="text-lg opacity-90">
                                            Reserva tu próxima cita con tu nutricionista de forma rápida y sencilla
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAppointmentCalendar(true)}
                                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                                >
                                    Agendar Turno
                                </button>
                            </div>
                        </div>

                        {/* Main Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Plan Nutricional */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2" style={{color: '#9575cd'}} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                        </svg>
                                        Mi Plan Nutricional
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                        </svg>
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Sin plan asignado</h4>
                                        <p className="text-gray-600 mb-4">
                                            Tu nutricionista aún no ha creado tu plan alimentario personalizado.
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Se te notificará cuando esté disponible.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Registro de Comidas - FUNCIONAL */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                        Registro de Comidas
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <MealPhotoUpload />
                                </div>
                            </div>

                            {/* Historial de Consultas */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Historial de Consultas
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Sin consultas registradas</h4>
                                        <p className="text-gray-600">
                                            Aquí verás el historial de todas tus consultas con tu nutricionista.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progreso y Medidas */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2" style={{color: '#9575cd'}} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                        </svg>
                                        Mi Progreso
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                        </svg>
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Seguimiento de Progreso</h4>
                                        <p className="text-gray-600">
                                            Aquí verás gráficos de tu evolución, peso, medidas y objetivos alcanzados.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Mis Citas Agendadas */}
                        <div className="mt-8 bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Mis Citas Agendadas
                                </h3>
                            </div>
                            <div className="p-6">
                                {loadingAppointments ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                                        <p className="text-gray-500 mt-2">Cargando citas...</p>
                                    </div>
                                ) : appointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {appointments.map((appointment) => (
                                            <div key={appointment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {appointment.consultation_type === 'inicial' ? 'Consulta Inicial' : 
                                                             appointment.consultation_type === 'seguimiento' ? 'Consulta de Seguimiento' : 
                                                             'Control'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {formatLocalDate(appointment.appointment_date)} a las {appointment.appointment_time}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Con: {appointment.nutritionist_name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                            appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {appointment.status === 'scheduled' ? 'Programada' :
                                                             appointment.status === 'confirmed' ? 'Confirmada' :
                                                             appointment.status === 'completed' ? 'Completada' :
                                                             appointment.status === 'cancelled' ? 'Cancelada' :
                                                             'No se presentó'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">No tienes citas agendadas</h4>
                                        <p className="text-gray-600">
                                            Agenda tu primera consulta usando el botón de arriba.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Information Card */}
                        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Información importante
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>
                                            Este es tu panel personal donde podrás ver tu plan nutricional, hacer seguimiento de tu progreso 
                                            y comunicarte con tu nutricionista. Las funciones avanzadas como carga de fotos de comidas y 
                                            reportes detallados estarán disponibles en próximas versiones.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Profile Settings Modal */}
            {showProfileSettings && (
                <ProfileSettings 
                    onClose={() => setShowProfileSettings(false)}
                    onUpdateProfile={() => {
                        // Aquí se podría actualizar los datos del usuario en el estado global
                        console.log('Profile updated successfully');
                    }}
                />
            )}

            {/* Appointment Calendar Modal */}
            {showAppointmentCalendar && (
                <AppointmentCalendar
                    onDateSelect={handleDateSelect}
                    onTimeSelect={handleTimeSelect}
                    onClose={handleCloseCalendar}
                />
            )}
        </Layout>
    );
}

export default PacienteDashboard;