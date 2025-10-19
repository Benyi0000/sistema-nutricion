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
    // 1. Adjuntar token de autenticación JWT
    const access = localStorage.getItem("access");
    if (access) config.headers.Authorization = `JWT ${access}`;

    // 2. Adjuntar token CSRF para métodos "inseguros"
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
            original.headers.Authorization = `JWT ${newAccess}`;

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
