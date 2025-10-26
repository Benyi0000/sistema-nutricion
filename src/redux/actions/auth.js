import { authAPI } from '../../lib/api';

export const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  USER_LOADED: 'USER_LOADED',
  AUTH_LOADING: 'AUTH_LOADING',
  AUTH_ERROR: 'AUTH_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

export const login = (credentials) => async (dispatch) => {
  dispatch({ type: AUTH_ACTIONS.AUTH_LOADING });
  
  try {
    const response = await authAPI.login(credentials);
    const { access, refresh, user } = response.data;

    // Guardar tokens y usuario en localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: { user, access_token: access, refresh_token: refresh }
    });

    // No redirigimos aquí, el componente Login se encarga de eso
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.non_field_errors?.[0] || 
                        error.response?.data?.detail || 
                        'Error de conexión';
    
    dispatch({
      type: AUTH_ACTIONS.LOGIN_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

export const logout = () => async (dispatch) => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await authAPI.logout(refreshToken);
    }
  } catch (error) {
    console.log('Error en logout:', error);
  } finally {
    // Limpiar storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    window.location.href = '/';
  }
};

export const loadUser = () => async (dispatch) => {
  const token = localStorage.getItem('access_token');
  const userData = localStorage.getItem('user');

  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      dispatch({
        type: AUTH_ACTIONS.USER_LOADED,
        payload: { user, access_token: token }
      });

      // Verificar token con el servidor
      const response = await authAPI.getProfile();
      const updatedUser = response.data.user;

      if (JSON.stringify(user) !== JSON.stringify(updatedUser)) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch({
          type: AUTH_ACTIONS.USER_LOADED,
          payload: { user: updatedUser, access_token: token }
        });
      }
    } catch (error) {
      console.log('Error loading user:', error);
      dispatch(logout());
    }
  }
};

export const clearError = () => ({
  type: AUTH_ACTIONS.CLEAR_ERROR
});