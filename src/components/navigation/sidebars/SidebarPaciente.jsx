import { NavLink } from 'react-router-dom';

export default function SidebarPaciente() {
    const base = "group flex items-center px-2 py-2 text-sm font-medium rounded-md";
    const idle = "text-gray-700 hover:bg-gray-100 hover:text-gray-900";
    const active = "bg-gray-100 text-gray-900";

    return (
        <div className="space-y-1">
        <NavLink to="/panel/paciente" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Mi Panel</NavLink>
        <NavLink to="/panel/paciente/planes" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Planes</NavLink>
        <NavLink to="/panel/paciente/seguimiento" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Seguimiento</NavLink>
        <NavLink to="/panel/paciente/configuracion" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Configuración</NavLink>
        </div>
    );
}
