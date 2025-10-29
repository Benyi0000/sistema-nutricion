import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function MealPhotoUpload() {
    const { access_token } = useSelector(state => state.auth);
    const [mealPhotos, setMealPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadData, setUploadData] = useState({
        meal_type: 'breakfast',
        meal_date: new Date().toISOString().split('T')[0],
        meal_time: new Date().toTimeString().slice(0, 5),
        description: '',
        notes: '',
        photo: null
    });
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');

    const mealTypes = {
        breakfast: 'Desayuno',
        morning_snack: 'Colación Media Mañana',
        lunch: 'Almuerzo',
        afternoon_snack: 'Merienda',
        dinner: 'Cena',
        night_snack: 'Colación Nocturna',
        other: 'Otro'
    };

    // Cargar fotos de comidas
    const loadMealPhotos = async () => {
        if (!access_token) {
            console.warn('No hay token de acceso disponible');
            return;
        }

        setLoading(true);
        setUploadError('');
        console.log('Cargando fotos con token:', access_token ? 'Token presente' : 'Sin token');
        console.log('URL de API:', `${API_URL}/meal-photos/`);
        
        try {
            const response = await fetch(`${API_URL}/meal-photos/`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            console.log('Respuesta del servidor:', response.status, response.statusText);

            if (response.ok) {
                const data = await response.json();
                console.log('Fotos cargadas:', data.length);
                setMealPhotos(data);
            } else {
                const errorData = await response.json();
                console.error('Error loading meal photos:', errorData);
                setUploadError(errorData.detail || 'Error al cargar las fotos');
            }
        } catch (error) {
            console.error('Error de conexión al cargar fotos:', error);
            // No mostrar error en la carga inicial, solo en consola
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMealPhotos();
    }, []);

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setUploadError('La imagen no debe superar los 5MB');
                return;
            }
            setUploadData({ ...uploadData, photo: file });
            setSelectedPhoto(URL.createObjectURL(file));
            setUploadError('');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploadError('');
        setUploadSuccess('');

        if (!uploadData.photo) {
            setUploadError('Por favor selecciona una foto');
            return;
        }

        if (!access_token) {
            setUploadError('No hay sesión activa. Por favor inicia sesión nuevamente.');
            return;
        }

        const formData = new FormData();
        formData.append('meal_type', uploadData.meal_type);
        formData.append('meal_date', uploadData.meal_date);
        formData.append('meal_time', uploadData.meal_time);
        formData.append('description', uploadData.description);
        formData.append('notes', uploadData.notes);
        formData.append('photo', uploadData.photo);

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/meal-photos/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                },
                body: formData
            });

            if (response.ok) {
                setUploadSuccess('¡Foto subida exitosamente!');
                setShowUploadForm(false);
                setUploadData({
                    meal_type: 'breakfast',
                    meal_date: new Date().toISOString().split('T')[0],
                    meal_time: new Date().toTimeString().slice(0, 5),
                    description: '',
                    notes: '',
                    photo: null
                });
                setSelectedPhoto(null);
                loadMealPhotos();
                
                setTimeout(() => setUploadSuccess(''), 3000);
            } else {
                const errorData = await response.json();
                console.error('Error del servidor:', errorData);
                
                // Manejar diferentes tipos de errores
                if (response.status === 401) {
                    setUploadError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                } else if (response.status === 403) {
                    setUploadError('No tienes permiso para realizar esta acción.');
                } else if (errorData.detail) {
                    setUploadError(errorData.detail);
                } else if (errorData.error) {
                    setUploadError(errorData.error);
                } else {
                    setUploadError('Error al subir la foto. Por favor intenta nuevamente.');
                }
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            setUploadError(`Error de conexión: ${error.message || 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (photoId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta foto?')) return;

        try {
            const response = await fetch(`${API_URL}/meal-photos/${photoId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            if (response.ok) {
                loadMealPhotos();
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Success Message */}
            {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">{uploadSuccess}</p>
                </div>
            )}

            {/* Upload Button */}
            {!showUploadForm && (
                <button
                    onClick={() => setShowUploadForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Subir Foto de Comida
                </button>
            )}

            {/* Upload Form */}
            {showUploadForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Subir Foto de Comida</h4>
                        <button
                            onClick={() => {
                                setShowUploadForm(false);
                                setSelectedPhoto(null);
                                setUploadError('');
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {uploadError && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-sm">{uploadError}</p>
                        </div>
                    )}

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Comida *
                                </label>
                                <select
                                    value={uploadData.meal_type}
                                    onChange={(e) => setUploadData({ ...uploadData, meal_type: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {Object.entries(mealTypes).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    value={uploadData.meal_date}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setUploadData({ ...uploadData, meal_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hora *
                            </label>
                            <input
                                type="time"
                                value={uploadData.meal_time}
                                onChange={(e) => setUploadData({ ...uploadData, meal_time: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Foto de la Comida *
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {selectedPhoto && (
                                <img
                                    src={selectedPhoto}
                                    alt="Vista previa"
                                    className="mt-2 max-w-full h-48 object-cover rounded-lg"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={uploadData.description}
                                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                placeholder="Ej: Avena con frutas y yogurt"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notas Adicionales
                            </label>
                            <textarea
                                value={uploadData.notes}
                                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                                placeholder="Ej: Aproximadamente 1 taza de avena, con plátano y fresas"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400"
                            >
                                {loading ? 'Subiendo...' : 'Subir Foto'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUploadForm(false);
                                    setSelectedPhoto(null);
                                    setUploadError('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Photos Grid */}
            {loading && mealPhotos.length === 0 ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Cargando...</p>
                </div>
            ) : mealPhotos.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-600">No has subido fotos de comidas aún</p>
                    <p className="text-sm text-gray-500 mt-1">Comienza documentando tus comidas para un mejor seguimiento</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {mealPhotos.map((photo) => (
                        <div key={photo.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h5 className="font-semibold text-gray-900">
                                            {mealTypes[photo.meal_type]}
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                            {new Date(photo.meal_date).toLocaleDateString('es-AR')} - {photo.meal_time}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {photo.is_reviewed && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Revisada
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(photo.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <img
                                    src={photo.photo_url}
                                    alt={photo.description}
                                    className="w-full h-64 object-cover rounded-lg mb-3"
                                />

                                {photo.description && (
                                    <p className="text-gray-700 mb-2">{photo.description}</p>
                                )}

                                {photo.notes && (
                                    <p className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium">Notas:</span> {photo.notes}
                                    </p>
                                )}

                                {photo.nutritionist_comment && (
                                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                        <p className="text-sm font-medium text-blue-900 mb-1">
                                            Comentario del nutricionista:
                                        </p>
                                        <p className="text-sm text-blue-800">{photo.nutritionist_comment}</p>
                                        {photo.estimated_calories && (
                                            <p className="text-xs text-blue-700 mt-2">
                                                Calorías estimadas: {photo.estimated_calories} kcal
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MealPhotoUpload;


