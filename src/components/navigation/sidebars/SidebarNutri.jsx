import { NavLink } from "react-router-dom";

export default function SidebarNutri() {
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
        <Item to="/panel/nutri" end>
            Mi Panel
        </Item>
        <Item to="/panel/nutri/pacientes">Pacientes</Item>

        {/* Consultas */}
        <div>
            <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Consultas
            </p>
            <div className="ml-3 space-y-1">
            <Item to="/panel/nutri/consultas/inicial">Consulta Inicial</Item>
            {/* ❌ Seguimiento eliminado del sidebar */}
            </div>
        </div>

        <Item to="/panel/nutri/preguntas">Banco de preguntas</Item>
        <Item to="/panel/nutri/plantillas">Plantillas</Item>
        </nav>
    );
}
