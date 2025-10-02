import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
    const { access, user } = useSelector(s => s.auth);
    if (!access) return <Navigate to="/login" replace />;
    if (!user) return null; // opcional: spinner
    return user.role === 'admin' ? children : <Navigate to="/nutri" replace />;
}
