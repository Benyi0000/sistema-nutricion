import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';

export default function LogoutButton({ className='' }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handle = async (e) => {
        e.preventDefault();
        await dispatch(logout());
        navigate('/login', { replace: true });
    };

    return (
        <button onClick={handle} className={className}>
        Cerrar sesión
        </button>
    );
}
