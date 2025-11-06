import { NavLink } from 'react-router-dom';

export default function SidebarAdmin() {
    const base = "group flex items-center px-2 py-2 text-sm font-medium rounded-md";
    const idle = "text-gray-700 hover:bg-gray-100 hover:text-gray-900";
    const active = "bg-gray-100 text-gray-900";

    return (
        <div className="space-y-1">
        <NavLink to="/panel/admin" className={({isActive}) => `${base} ${isActive ? active : idle}`}>
            Dashboard
        </NavLink>
        <NavLink to="/panel/admin/usuarios" className={({isActive}) => `${base} ${isActive ? active : idle}`}>
            Usuarios
        </NavLink>
        <NavLink to="/panel/admin/nutricionistas" className={({isActive}) => `${base} ${isActive ? active : idle}`}>
            Nutricionistas
        </NavLink>
        <NavLink to="/panel/admin/nutricionistas/crear" className={({isActive}) => `${base} ${isActive ? active : idle}`}>
            Alta nutricionista
        </NavLink>
        <NavLink to="/panel/admin/configuracion" className={({isActive}) => `${base} ${isActive ? active : idle}`}>
            Configuración
        </NavLink>
        </div>
    );
}
