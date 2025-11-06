import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function PacienteRoute({ children }) {
    const { access, user, status } = useSelector(s => s.auth);
    
    // No hay token: redirigir a login
    if (!access) return <Navigate to="/login" replace />;
    
    // Hay token pero no usuario y está cargando: mostrar spinner
    if (!user && status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }
    
    // Hay token pero no usuario: esperar
    if (!user) return null;
    
    // Verificar que sea paciente
    return user.role === 'paciente' || user.paciente ? children : <Navigate to="/login" replace />;
}
