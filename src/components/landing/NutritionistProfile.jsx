function NutritionistProfile() {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Foto de la profesional */}
                    <div className="md:w-1/3 flex justify-center">
                        <div className="w-48 h-48 bg-gray-300 rounded-lg shadow-lg flex items-center justify-center">
                            <svg className="w-24 h-24 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    
                    {/* Información profesional */}
                    <div className="md:w-2/3">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            Lic. Olmedo Leila
                        </h3>
                        <p className="text-gray-600 mb-2">
                            Licenciada en Nutrición (M.N. 310)
                        </p>
                        <p className="text-gray-700">
                            Especialista en educación alimentaria, obesidad, deporte y nutrición infantil.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default NutritionistProfile;