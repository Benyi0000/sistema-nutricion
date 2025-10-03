function BenefitsSection() {
    const benefits = [
        "Atención personalizada y profesional",
        "Acceso online a tu historial y planes", 
        "Plataforma segura y fácil de usar"
    ];

    return (
        <section id="beneficios" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                    ¿Por qué elegirnos?
                </h2>
                
                <ul className="max-w-2xl mx-auto space-y-4">
                    {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                            <span className="mr-3" style={{color: '#9575cd'}}>✓</span>
                            <span className="text-gray-700">{benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default BenefitsSection;