import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function NutriRoute({ children }) {
    const { access, user } = useSelector(s => s.auth);
    if (!access) return <Navigate to="/login" replace />;
    if (!user) return null;
    return user.role === 'nutricionista' ? children : <Navigate to="/admin" replace />;
}
