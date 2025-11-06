function HeroSection() {
    return (
      <section className="pt-24 pb-16 text-center" style={{ backgroundColor: '#e8ddf5' }}>
        <div className="container mx-auto px-4">
          {/* Título principal */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Transforma tu salud con <span style={{ color: '#9575cd' }}>NutriSalud</span>
          </h1>
  
          {/* Mensaje de bienvenida */}
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Bienvenido a nuestra plataforma.
          </p>
  
          {/* Descripción breve (tagline) */}
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Gestión integral de turnos, evaluaciones y planes alimentarios en un solo lugar.
          </p>
        </div>
      </section>
    );
  }
  
  export default HeroSection;
  