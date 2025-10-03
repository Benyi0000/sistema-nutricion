function TestimonialsSection() {
    const testimonials = [
        {
            name: "Juan R.",
            description: "paciente desde 2023",
            comment: "Gracias a NutriSalud pude mejorar mis hábitos alimenticios..."
        },
        {
            name: "Lucía M.",
            description: "paciente desde 2024", 
            comment: "El seguimiento es excelente. Me siento acompañada..."
        }
    ];

    return (
        <section id="testimonios" className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                    Testimonios de Pacientes
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index}>
                            <blockquote className="text-lg text-gray-700 italic mb-4">
                                "{testimonial.comment}"
                            </blockquote>
                            <footer className="text-gray-600">
                                {testimonial.name}, {testimonial.description}
                            </footer>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default TestimonialsSection;