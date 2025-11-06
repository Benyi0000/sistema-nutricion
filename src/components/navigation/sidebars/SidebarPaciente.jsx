import { NavLink } from "react-router-dom";

export default function SidebarPaciente() {
    const Item = ({ to, end, children }) => (
        <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `block rounded-md px-3 py-2 text-sm transition ${
            isActive
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`
        }
        >
        {children}
        </NavLink>
    );

    return (
        <nav className="flex-1 p-3 space-y-1">
        <Item to="/panel/paciente" end>
            Mi Panel
        </Item>

        {/* Agenda */}
        <div>
            <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Agenda
            </p>
            <div className="ml-3 space-y-1">
            <Item to="/panel/paciente/agenda/solicitar">Solicitar Turno</Item>
            <Item to="/panel/paciente/agenda/mis-turnos">Mis Turnos</Item>
            </div>
        </div>

        <Item to="/panel/paciente/planes">Planes Nutricionales</Item>
        <Item to="/panel/paciente/seguimiento">Seguimiento</Item>

        {/* Perfil */}
        <div>
            <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Mi Perfil
            </p>
            <div className="ml-3 space-y-1">
                <Item to="/panel/paciente/configuracion">Configuración de perfil</Item>
            </div>
        </div>
        </nav>
    );
}
