import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function PacienteRoute({ children }) {
    const { access, user } = useSelector(s => s.auth);
    if (!access) return <Navigate to="/login" replace />;
    if (!user) return null;
    return user.role === 'paciente' ? children : <Navigate to="/login" replace />;
}
