// Ejemplo en un componente de Configuración de Usuario
function ConfiguracionUsuario() {
    const handleLinkGoogle = () => {
        // Redirige al backend para iniciar el flujo de vinculación de Google
        // Ajusta la URL si es necesario
        window.location.href = `${import.meta.env.VITE_API_URL}/social/login/google-oauth2/`;
    };

    return (
        <div>
        <h2>Vincular Cuentas Sociales</h2>
        {/* Aquí podrías mostrar si ya está vinculada */}
        <button
            onClick={handleLinkGoogle}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
            Vincular cuenta de Google
        </button>
        {/* Aquí podrías añadir un botón para desvincular si ya está vinculada */}
        </div>
    );
}

export default ConfiguracionUsuario;