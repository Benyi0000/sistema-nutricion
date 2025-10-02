// src/components/consultas/PacienteForm.jsx
export default function PacienteForm({ pac, onChange, fieldError }) {
    const input = (name, label, type = "text", extra = {}) => (
        <div>
        <label className="text-sm">{label}</label>
        <input
            className="border p-2 rounded w-full"
            name={name}
            type={type}
            value={pac[name]}
            onChange={onChange}
            {...extra}
        />
        {fieldError(name) && (
            <p className="text-red-600 text-xs">{fieldError(name)}</p>
        )}
        </div>
    );

    return (
        <>
        {input("dni", "DNI *", "text", { required: true })}
        {input("email", "Email", "email")}
        {input("first_name", "Nombre")}
        {input("last_name", "Apellido")}
        {input("telefono", "Teléfono")}
        {input("fecha_nacimiento", "Fecha nacimiento", "date")}
        <div>
            <label className="text-sm">Género</label>
            <select
            className="border p-2 rounded w-full"
            name="genero"
            value={pac.genero}
            onChange={onChange}
            >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
            </select>
        </div>
        </>
    );
}
