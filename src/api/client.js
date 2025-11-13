import axios from "axios";

// Helper para obtener el valor de una cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ej: http://localhost:8000
    withCredentials: true, // Habilitar para enviar cookies (CSRF)
    });

    api.interceptors.request.use((config) => {
    // Asegurar que headers existe
    if (!config.headers) {
        config.headers = {};
    }

    // 1. Si es FormData, eliminar Content-Type COMPLETAMENTE antes de cualquier otra operación
    // Esto es crítico: axios debe establecer automáticamente multipart/form-data con boundary
    if (config.data instanceof FormData) {
        // Eliminar Content-Type de todas las formas posibles
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
        delete config.headers['Content-type'];
        
        // Deshabilitar transformRequest para FormData - dejar que el navegador lo maneje
        config.transformRequest = [];
    } else if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData) && !Array.isArray(config.data) && !(config.data instanceof Blob) && !(config.data instanceof File)) {
        // Para otros tipos de datos (objetos planos), establecer Content-Type como JSON solo si no está definido
        if (!config.headers['Content-Type'] && !config.headers['content-type']) {
            config.headers['Content-Type'] = 'application/json';
        }
    }

    // 2. Adjuntar token de autenticación JWT
    const access = localStorage.getItem("access");
    if (access) {
        config.headers.Authorization = `Bearer ${access}`;
    }

    // 3. Adjuntar token CSRF para métodos "inseguros"
    const isSafeMethod = /^(GET|HEAD|OPTIONS)$/.test(config.method.toUpperCase());
    if (!isSafeMethod) {
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
    }

    return config;
    });

    let isRefreshing = false;
    let refreshPromise = null;

    api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error?.response?.status;
        const original = error.config || {};
        const url = original?.url || "";

        const isAuthEndpoint =
        url.includes("/auth/jwt/create") || url.includes("/auth/jwt/refresh");

        if (status === 401 && !original._retry && !isAuthEndpoint) {
        original._retry = true;

        const refresh = localStorage.getItem("refresh");
        if (!refresh) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            window.location.href = "/login";
            return Promise.reject(error);
        }

        try {
            if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = axios
                .post(`${import.meta.env.VITE_API_URL}/auth/jwt/refresh/`, { refresh })
                .then(({ data }) => {
                const newAccess = data?.access;
                if (newAccess) localStorage.setItem("access", newAccess);
                isRefreshing = false;
                return newAccess;
                })
                .catch((e) => {
                isRefreshing = false;
                throw e;
                });
            }

            const newAccess = await refreshPromise;
            if (!newAccess) throw new Error("No access after refresh");

            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newAccess}`;

            return api(original);
        } catch (e) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            window.location.href = "/login";
            return Promise.reject(e);
        }
        }

        return Promise.reject(error);
    }
);

export default api;
