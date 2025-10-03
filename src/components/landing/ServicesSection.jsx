import React from 'react';
import { FaUserAlt, FaUtensils } from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';

function ServicesSection() {

    const services = [
        {
            icon: FaUserAlt,
            title: "Evaluación Nutricional",
            description: "Mediciones antropométricas completas y cálculo de indicadores como IMC e ICC."
        },
        {
            icon: FaUtensils,
            title: "Plan Alimentario",
            description: "Dietas personalizadas con objetivos claros: salud, rendimiento o bienestar."
        },
        {
            icon: FiTrendingUp,
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
                    {services.map((service, idx) => {
                        const Icon = service.icon;
                        return (
                            <div key={idx} className="flex flex-col items-center px-4">
                                <div
                                    className="mb-4 flex items-center justify-center rounded-full"
                                    style={{ backgroundColor: '#F3E8FF', width: (idx===0? '5rem' : '5rem'), height: (idx===0? '5rem' : '5rem') }}
                                    aria-hidden="true"
                                >
                                    <Icon size={28} style={{ color: '#9575CD' }} aria-hidden="true" />
                                </div>
                                <h5 className="text-xl font-semibold text-gray-800 mb-3">
                                    {service.title}
                                </h5>
                                <p className="text-gray-600 leading-relaxed max-w-[30rem]">
                                    {service.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;
