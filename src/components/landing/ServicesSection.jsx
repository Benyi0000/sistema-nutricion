

function ServicesSection() {
    
    const services = [
        {
            image: null,
            title: "Evaluación Nutricional",
            description: "Mediciones antropométricas completas y cálculo de indicadores como IMC e ICC."
        },
        {
            image: null,
            title: "Plan Alimentario", 
            description: "Dietas personalizadas con objetivos claros: salud, rendimiento o bienestar."
        },
        {
            image: null,
            title: "Seguimiento Continuo",
            description: "Control de progreso con gráficas, reportes y sugerencias adaptativas."
        }
    ];

    return (
        <section id="servicios" className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                    Nuestros Servicios
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {services.map((service, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#f3f0ff'}}>
                                <svg className="w-10 h-10" style={{color: '#9575cd'}} fill="currentColor" viewBox="0 0 24 24">
                                    {index === 0 && <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />}
                                    {index === 1 && <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />}
                                    {index === 2 && <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-2 2V7H5v10h7.586l-2 2H4a1 1 0 01-1-1V4z M21 11.414l-2-2V21a1 1 0 01-1 1H6.414l2-2H17V11.414z" />}
                                </svg>
                            </div>
                            <h5 className="text-xl font-semibold text-gray-800 mb-3">
                                {service.title}
                            </h5>
                            <p className="text-gray-600 leading-relaxed">
                                {service.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;