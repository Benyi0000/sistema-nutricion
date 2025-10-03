import { useState } from 'react';

function FAQSection() {
    const [openFaq, setOpenFaq] = useState(0);

    const faqs = [
        {
            question: "¿Cómo puedo agendar una cita?",
            answer: "Simplemente hacé clic en 'Agendar Cita'..."
        },
        {
            question: "¿La primera consulta incluye plan alimentario?",
            answer: "Sí, una vez evaluado tu perfil..."
        },
        {
            question: "¿Qué medios de pago aceptan?",
            answer: "Efectivo, transferencia y también tarjetas..."
        }
    ];

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <section className="py-16 bg-gray-50" id="faq">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                    Preguntas Frecuentes
                </h2>
                
                <div className="max-w-2xl mx-auto">
                    {faqs.map((faq, index) => (
                        <div key={index} className="mb-4 bg-white rounded-lg shadow-sm border">
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full text-left p-4 font-medium text-gray-800 hover:bg-gray-50 flex justify-between items-center"
                            >
                                {faq.question}
                                <svg className={`w-5 h-5 transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {openFaq === index && (
                                <div className="p-4 border-t bg-gray-50">
                                    <p className="text-gray-600">{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default FAQSection;