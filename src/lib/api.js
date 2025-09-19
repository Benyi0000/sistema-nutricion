import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Reintentar petición original con nuevo token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh falló, limpiar tokens y redirigir al login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No hay refresh token, redirigir al login
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  register: (userData) => api.post('/auth/register/', userData),
  getProfile: () => api.get('/auth/me/'),
  changePassword: (passwords) => api.post('/auth/change-password/', passwords),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
};

export const profileAPI = {
  updateProfile: (profileData) => {
    // Si ya es FormData, usarlo directamente
    if (profileData instanceof FormData) {
      return api.put('/auth/profile/', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    
    // Si no es FormData, crear uno
    const formData = new FormData();
    
    // Agregar campos de texto
    Object.keys(profileData).forEach(key => {
      if (key !== 'profile_photo' && profileData[key] !== null && profileData[key] !== undefined) {
        formData.append(key, profileData[key]);
      }
    });
    
    // Agregar archivo de imagen si existe
    if (profileData.profile_photo && profileData.profile_photo instanceof File) {
      formData.append('profile_photo', profileData.profile_photo);
    }
    
    return api.put('/auth/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  changePassword: (passwordData) => {
    return api.post('/auth/change-password/', passwordData);
  },
  
  uploadProfilePhoto: (photoFile) => {
    const formData = new FormData();
    formData.append('profile_photo', photoFile);
    
    return api.post('/auth/profile/photo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export const patientsAPI = {
  list: () => api.get('/patients/'),
  create: (patientData) => api.post('/patients/', patientData),
  get: (id) => api.get(`/patients/${id}/`),
  update: (id, patientData) => api.put(`/patients/${id}/`, patientData),
  delete: (id) => api.delete(`/patients/${id}/`),
};

// API para el sistema de captura de historia clínica y hábitos alimenticios
export const formularioAPI = {
  // Buscar paciente por DNI o ID
  buscarPaciente: (params) => api.get('/formulario/buscar-paciente/', { params }),
  
  // Obtener formulario existente de un paciente
  obtenerFormulario: (pacienteId) => api.get(`/formulario/paciente/${pacienteId}/`),
  
  // Capturar formulario completo
  capturarFormulario: (formularioData) => api.post('/formulario/captura/', formularioData),
};

export default api;