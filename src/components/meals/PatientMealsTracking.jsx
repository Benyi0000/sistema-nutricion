import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MealPhotoReview from './MealPhotoReview';
import { patientsAPI } from '../../lib/api';

function PatientMealsTracking() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await patientsAPI.list();
            
            // El serializer devuelve datos anidados: patient.person.user.first_name
            // Necesitamos transformar los datos para que sean más fáciles de usar
            const transformedPatients = response.data.map(patient => ({
                id: patient.id,
                first_name: patient.person?.user?.first_name || '',
                last_name: patient.person?.user?.last_name || '',
                dni: patient.person?.user?.dni || '',
                email: patient.person?.user?.email || '',
                phone: patient.person?.phone || '',
            }));
            
            setPatients(transformedPatients);
        } catch (error) {
            console.error('Error loading patients:', error);
            setError(error.response?.data?.detail || error.message || 'Error al cargar pacientes');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const dni = patient.dni || '';
        return fullName.includes(searchTerm.toLowerCase()) || dni.includes(searchTerm);
    });

    if (selectedPatient) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                    <button
                        onClick={() => setSelectedPatient(null)}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a la lista de pacientes
                    </button>
                    <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                        </div>
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedPatient.first_name} {selectedPatient.last_name}
                            </h2>
                            <p className="text-sm text-gray-600">DNI: {selectedPatient.dni}</p>
                        </div>
                    </div>
                </div>

                <MealPhotoReview 
                    patientId={selectedPatient.id} 
                    patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Seguimiento de Comidas de Pacientes
                </h2>
                <p className="text-gray-600">
                    Selecciona un paciente para ver y revisar sus registros de comidas
                </p>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg 
                        className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Patients List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando pacientes...</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-gray-600 text-lg">
                        {searchTerm ? 'No se encontraron pacientes' : 'No tienes pacientes asignados'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => setSelectedPatient(patient)}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex items-center mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                    {(patient.first_name?.[0] || '')}{(patient.last_name?.[0] || '')}
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="font-semibold text-gray-900">
                                        {patient.first_name} {patient.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-600">DNI: {patient.dni}</p>
                                </div>
                            </div>

                            {patient.email && (
                                <div className="flex items-center text-xs text-gray-600 mb-1">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {patient.email}
                                </div>
                            )}

                            {patient.phone && (
                                <div className="flex items-center text-xs text-gray-600">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {patient.phone}
                                </div>
                            )}

                            <button
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver Seguimiento
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PatientMealsTracking;

