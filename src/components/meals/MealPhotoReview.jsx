import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function MealPhotoReview({ patientId, patientName }) {
    const { access_token } = useSelector(state => state.auth);
    const [mealPhotos, setMealPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'reviewed'
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [reviewData, setReviewData] = useState({
        nutritionist_comment: '',
        estimated_calories: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mealTypes = {
        breakfast: 'Desayuno',
        morning_snack: 'Colación Media Mañana',
        lunch: 'Almuerzo',
        afternoon_snack: 'Merienda',
        dinner: 'Cena',
        night_snack: 'Colación Nocturna',
        other: 'Otro'
    };

    const loadMealPhotos = async () => {
        setLoading(true);
        setError('');
        try {
            let url = `${API_URL}/meal-photos/?patient_id=${patientId}`;
            
            if (filter === 'pending') {
                url += '&reviewed=false';
            } else if (filter === 'reviewed') {
                url += '&reviewed=true';
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMealPhotos(data);
            } else {
                const errorData = await response.json();
                console.error('Error loading meal photos:', errorData);
                setError(errorData.detail || 'Error al cargar las fotos de comidas');
            }
        } catch (error) {
            console.error('Error loading meal photos:', error);
            setError('Error de conexión al cargar las fotos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) {
            loadMealPhotos();
        }
    }, [patientId, filter]);

    const handleReview = async (photoId) => {
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_URL}/meal-photos/${photoId}/review/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                setSuccess('¡Revisión guardada exitosamente!');
                setSelectedPhoto(null);
                setReviewData({ nutritionist_comment: '', estimated_calories: '' });
                loadMealPhotos();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Error al guardar la revisión');
            }
        } catch (error) {
            console.error('Error reviewing photo:', error);
            setError('Error de conexión al guardar la revisión');
        }
    };

    const openReviewModal = (photo) => {
        setSelectedPhoto(photo);
        setReviewData({
            nutritionist_comment: photo.nutritionist_comment || '',
            estimated_calories: photo.estimated_calories || ''
        });
    };

    return (
        <div className="space-y-4">
            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">{success}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'pending'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Pendientes
                </button>
                <button
                    onClick={() => setFilter('reviewed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'reviewed'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Revisadas
                </button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Cargando...</p>
                </div>
            ) : mealPhotos.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-600">
                        {filter === 'pending' ? 'No hay fotos pendientes de revisión' : 'No hay fotos registradas'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mealPhotos.map((photo) => (
                        <div key={photo.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative">
                                <img
                                    src={photo.photo_url}
                                    alt={photo.description}
                                    className="w-full h-48 object-cover"
                                />
                                {photo.is_reviewed && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Revisada
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h5 className="font-semibold text-gray-900">
                                            {mealTypes[photo.meal_type]}
                                        </h5>
                                        <p className="text-xs text-gray-600">
                                            {new Date(photo.meal_date).toLocaleDateString('es-AR')} - {photo.meal_time}
                                        </p>
                                    </div>
                                </div>

                                {photo.description && (
                                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{photo.description}</p>
                                )}

                                <button
                                    onClick={() => openReviewModal(photo)}
                                    className={`w-full mt-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                        photo.is_reviewed
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {photo.is_reviewed ? 'Ver Detalles' : 'Revisar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {mealTypes[selectedPhoto.meal_type]}
                            </h3>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Photo Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Paciente:</span> {selectedPhoto.patient_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Fecha:</span> {new Date(selectedPhoto.meal_date).toLocaleDateString('es-AR')} - {selectedPhoto.meal_time}
                                </p>
                            </div>

                            {/* Photo */}
                            <img
                                src={selectedPhoto.photo_url}
                                alt={selectedPhoto.description}
                                className="w-full rounded-lg"
                            />

                            {/* Patient Description */}
                            {selectedPhoto.description && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Descripción del paciente:</h4>
                                    <p className="text-gray-700">{selectedPhoto.description}</p>
                                </div>
                            )}

                            {selectedPhoto.notes && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Notas:</h4>
                                    <p className="text-gray-700">{selectedPhoto.notes}</p>
                                </div>
                            )}

                            {/* Review Form */}
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Tu Revisión:</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Comentario Nutricional
                                        </label>
                                        <textarea
                                            value={reviewData.nutritionist_comment}
                                            onChange={(e) => setReviewData({ ...reviewData, nutritionist_comment: e.target.value })}
                                            placeholder="Escribe tus comentarios y recomendaciones nutricionales..."
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="4"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Calorías Estimadas (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            value={reviewData.estimated_calories}
                                            onChange={(e) => setReviewData({ ...reviewData, estimated_calories: e.target.value })}
                                            placeholder="350"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleReview(selectedPhoto.id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Guardar Revisión
                                        </button>
                                        <button
                                            onClick={() => setSelectedPhoto(null)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MealPhotoReview;


