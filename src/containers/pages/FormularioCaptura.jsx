import React, { useState, useEffect } from 'react';
import { formularioAPI } from '../../lib/api';

// Componente reutilizable de navegación con botón de guardar
const StepNavigation = ({ onBack, onNext, onSave, loading, showSave = true, nextLabel = "Siguiente" }) => {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
      <button 
        onClick={onBack} 
        className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Anterior
      </button>
      
      <div className="flex gap-3">
        {showSave && onSave && (
          <button 
            onClick={onSave}
            disabled={loading}
            className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Guardar progreso
              </>
            )}
          </button>
        )}
        
        <button 
          onClick={onNext} 
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          {nextLabel}
          <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};


const FormularioCaptura = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [paciente, setPaciente] = useState(null);
  const [formData, setFormData] = useState({
    paciente_ref: {},
    historia_clinica: {},
    habitos_alimenticios: {},
    indicadores_dietarios: {},
    datos_para_calculadora: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    'Buscar Paciente',
    'Historia Clínica', 
    'Hábitos Alimenticios',
    'Indicadores Dietarios',
    'Datos Calculadora',
    'Resumen'
  ];

  const buscarPaciente = async (dni) => {
    try {
      setLoading(true);
      const response = await formularioAPI.buscarPaciente({ dni });
      setPaciente(response.data.paciente);
      setFormData(prev => ({
        ...prev,
        paciente_ref: {
          id_paciente: response.data.paciente.id,
          dni: response.data.paciente.dni,
          nombre: response.data.paciente.nombre,
          apellido: response.data.paciente.apellido
        }
      }));
      setCurrentStep(1);
    } catch (err) {
      setError('Paciente no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await formularioAPI.capturarFormulario(formData);
      alert('✅ Formulario guardado exitosamente!\n\nTodos los datos han sido almacenados correctamente.');
      console.log('Respuesta:', response.data);
      // Limpiar formulario y regresar al inicio
      setFormData({
        paciente_ref: {},
        historia_clinica: {},
        habitos_alimenticios: {},
        indicadores_dietarios: {},
        datos_para_calculadora: {}
      });
      setPaciente(null);
      setCurrentStep(0);
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('❌ Error al guardar el formulario.\n\nPor favor, intente nuevamente.');
      setError('Error al capturar formulario');
    } finally {
      setLoading(false);
    }
  };

  const handlePartialSave = async () => {
    try {
      setLoading(true);
      const response = await formularioAPI.capturarFormulario(formData);
      alert('💾 Progreso guardado exitosamente!\n\nPuede continuar más tarde desde donde quedó.');
      console.log('Respuesta parcial:', response.data);
    } catch (err) {
      console.error('Error al guardar parcialmente:', err);
      alert('❌ Error al guardar el progreso.\n\nPor favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Captura de Historia Clínica y Hábitos Alimenticios
        </h1>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xs mt-2 text-center">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {currentStep === 0 && (
            <BuscarPacienteStep onBuscar={buscarPaciente} loading={loading} error={error} />
          )}
          
          {currentStep === 1 && (
            <HistoriaClinicaStep 
              formData={formData} 
              setFormData={setFormData}
              onNext={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
              onSave={handlePartialSave}
              loading={loading}
            />
          )}
          
          {currentStep === 2 && (
            <HabitosAlimenticiosStep 
              formData={formData} 
              setFormData={setFormData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
              onSave={handlePartialSave}
              loading={loading}
            />
          )}
          
          {currentStep === 3 && (
            <IndicadoresDietariosStep 
              formData={formData} 
              setFormData={setFormData}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
              onSave={handlePartialSave}
              loading={loading}
            />
          )}
          
          {currentStep === 4 && (
            <DatosCalculadoraStep 
              formData={formData} 
              setFormData={setFormData}
              onNext={() => setCurrentStep(5)}
              onBack={() => setCurrentStep(3)}
              onSave={handlePartialSave}
              loading={loading}
            />
          )}
          
          {currentStep === 5 && (
            <ResumenStep 
              formData={formData}
              paciente={paciente}
              onSubmit={handleSubmit}
              onBack={() => setCurrentStep(4)}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para buscar paciente
const BuscarPacienteStep = ({ onBuscar, loading, error }) => {
  const [dni, setDni] = useState('');
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const handleBuscar = () => {
    if (dni.length === 8) {
      setBusquedaRealizada(true);
      onBuscar(dni);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Buscar Paciente</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DNI del Paciente
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={dni}
              onChange={(e) => {
                setDni(e.target.value.replace(/\D/g, '')); // Solo números
                setBusquedaRealizada(false);
              }}
              placeholder="Ingrese el DNI (8 dígitos)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="8"
            />
            <button
              onClick={handleBuscar}
              disabled={loading || dni.length !== 8}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ingrese el DNI del paciente (8 dígitos numéricos)
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          </div>
        )}

        {busquedaRealizada && !error && !loading && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-600 text-sm">Paciente encontrado. Puede continuar con el formulario.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para historia clínica
const HistoriaClinicaStep = ({ formData, setFormData, onNext, onBack, onSave, loading }) => {
  const [data, setData] = useState({
    antecedentes_familiares: '',
    enfermedades_actuales: '',
    modifico_dieta: 'NO',
    medicacion_usa: 'NO',
    medicacion_detalle: '',
    cirugias_tiene: 'NO',
    cirugias_detalle: ''
  });

  const handleNext = () => {
    setFormData(prev => ({
      ...prev,
      historia_clinica: {
        antecedentes_familiares: data.antecedentes_familiares.split(',').map(item => item.trim()).filter(item => item),
        enfermedades_actuales: data.enfermedades_actuales.split(',').map(item => item.trim()).filter(item => item),
        modifico_dieta: data.modifico_dieta,
        medicacion: { usa: data.medicacion_usa, detalle: data.medicacion_detalle },
        cirugias_recientes: { tiene: data.cirugias_tiene, detalle: data.cirugias_detalle }
      }
    }));
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Historia Clínica</h2>
      
      <div className="space-y-6">
        {/* Antecedentes familiares */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Antecedentes familiares
          </label>
          <textarea
            value={data.antecedentes_familiares}
            onChange={(e) => setData(prev => ({ ...prev, antecedentes_familiares: e.target.value }))}
            placeholder="Ej: DBT, HTA, Obesidad, Dislipidemias, Cardiovasculares (separar con comas)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">Separe cada antecedente con una coma</p>
        </div>

        {/* Enfermedades actuales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enfermedades que padece actualmente
          </label>
          <textarea
            value={data.enfermedades_actuales}
            onChange={(e) => setData(prev => ({ ...prev, enfermedades_actuales: e.target.value }))}
            placeholder="Ej: DBT, HTA, Obesidad, Dislipidemias, Cardiovasculares (separar con comas)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">Separe cada enfermedad con una coma</p>
        </div>

        {/* Modificación de dieta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Ha modificado su dieta por esa enfermedad?
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="SI"
                checked={data.modifico_dieta === 'SI'}
                onChange={(e) => setData(prev => ({ ...prev, modifico_dieta: e.target.value }))}
                className="mr-2"
              />
              Sí
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="NO"
                checked={data.modifico_dieta === 'NO'}
                onChange={(e) => setData(prev => ({ ...prev, modifico_dieta: e.target.value }))}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        {/* Medicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Toma medicación actualmente?
          </label>
          <div className="flex space-x-4 mb-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="SI"
                checked={data.medicacion_usa === 'SI'}
                onChange={(e) => setData(prev => ({ ...prev, medicacion_usa: e.target.value }))}
                className="mr-2"
              />
              Sí
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="NO"
                checked={data.medicacion_usa === 'NO'}
                onChange={(e) => setData(prev => ({ ...prev, medicacion_usa: e.target.value }))}
                className="mr-2"
              />
              No
            </label>
          </div>
          {data.medicacion_usa === 'SI' && (
            <input
              type="text"
              value={data.medicacion_detalle}
              onChange={(e) => setData(prev => ({ ...prev, medicacion_detalle: e.target.value }))}
              placeholder="¿Cuál medicación?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}
        </div>

        {/* Cirugías */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Ha tenido cirugías recientemente?
          </label>
          <div className="flex space-x-4 mb-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="SI"
                checked={data.cirugias_tiene === 'SI'}
                onChange={(e) => setData(prev => ({ ...prev, cirugias_tiene: e.target.value }))}
                className="mr-2"
              />
              Sí
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="NO"
                checked={data.cirugias_tiene === 'NO'}
                onChange={(e) => setData(prev => ({ ...prev, cirugias_tiene: e.target.value }))}
                className="mr-2"
              />
              No
            </label>
          </div>
          {data.cirugias_tiene === 'SI' && (
            <input
              type="text"
              value={data.cirugias_detalle}
              onChange={(e) => setData(prev => ({ ...prev, cirugias_detalle: e.target.value }))}
              placeholder="¿Cuál cirugía?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Anterior
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

const HabitosAlimenticiosStep = ({ formData, setFormData, onNext, onBack, onSave, loading }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      habitos_alimenticios: {
        ...prev.habitos_alimenticios,
        [field]: value
      }
    }));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Hábitos Alimenticios</h2>

      <div className="space-y-6">
        {/* SECCIÓN: PATRONES DE COMIDAS */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            Patrones de Comidas
          </h3>

          <div className="space-y-6">
            {/* Número de comidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuántas comidas realiza al día?
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.habitos_alimenticios.comidas_dia || ''}
                onChange={(e) => handleChange('comidas_dia', e.target.value)}
                placeholder="Ej: 3, 4, 5..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tipo de comidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccione las comidas que realiza habitualmente:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {['Desayuno', 'Almuerzo', 'Merienda', 'Cena'].map(comida => (
                  <label key={comida} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.habitos_alimenticios[`realiza_${comida.toLowerCase()}`] || false}
                      onChange={(e) => handleChange(`realiza_${comida.toLowerCase()}`, e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{comida}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Se salta comidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Acostumbra saltarse comidas?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="salta_comidas"
                    value="si"
                    checked={formData.habitos_alimenticios.salta_comidas === 'si'}
                    onChange={(e) => handleChange('salta_comidas', e.target.value)}
                    className="mr-2"
                  />
                  SÍ
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="salta_comidas"
                    value="no"
                    checked={formData.habitos_alimenticios.salta_comidas === 'no'}
                    onChange={(e) => handleChange('salta_comidas', e.target.value)}
                    className="mr-2"
                  />
                  NO
                </label>
              </div>

              {formData.habitos_alimenticios.salta_comidas === 'si' && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuál comida suele saltarse?</label>
                    <input
                      type="text"
                      placeholder="Ej: Desayuno, Almuerzo..."
                      value={formData.habitos_alimenticios.cual_comida_salta || ''}
                      onChange={(e) => handleChange('cual_comida_salta', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Por qué motivo?</label>
                    <input
                      type="text"
                      placeholder="Ej: Falta de tiempo, no tiene hambre..."
                      value={formData.habitos_alimenticios.por_que_salta || ''}
                      onChange={(e) => handleChange('por_que_salta', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN: ENTORNO SOCIAL Y RUTINAS */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            Entorno Social y Rutinas
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Con quién vive?
              </label>
              <input
                type="text"
                value={formData.habitos_alimenticios.con_quien_vive || ''}
                onChange={(e) => handleChange('con_quien_vive', e.target.value)}
                placeholder="Ej: Solo/a, familia, pareja..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Quién prepara sus alimentos?
              </label>
              <input
                type="text"
                value={formData.habitos_alimenticios.quien_prepara || ''}
                onChange={(e) => handleChange('quien_prepara', e.target.value)}
                placeholder="Ej: Yo mismo/a, mi madre, servicio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿A qué hora se levanta habitualmente?
              </label>
              <input
                type="time"
                value={formData.habitos_alimenticios.hora_levanta || ''}
                onChange={(e) => handleChange('hora_levanta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Realiza actividad física?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="actividad_fisica"
                    value="si"
                    checked={formData.habitos_alimenticios.actividad_fisica === 'si'}
                    onChange={(e) => handleChange('actividad_fisica', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="actividad_fisica"
                    value="no"
                    checked={formData.habitos_alimenticios.actividad_fisica === 'no'}
                    onChange={(e) => handleChange('actividad_fisica', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN: CONSUMO ENTRE COMIDAS */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-orange-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            Consumo Entre Comidas
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Consume alimentos o bebidas fuera de las comidas principales?
            </label>
            <div className="flex space-x-4 mb-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="consume_fuera_comidas"
                  value="si"
                  checked={formData.habitos_alimenticios.consume_fuera_comidas === 'si'}
                  onChange={(e) => handleChange('consume_fuera_comidas', e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">SÍ</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="consume_fuera_comidas"
                  value="no"
                  checked={formData.habitos_alimenticios.consume_fuera_comidas === 'no'}
                  onChange={(e) => handleChange('consume_fuera_comidas', e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">NO</span>
              </label>
            </div>

            {formData.habitos_alimenticios.consume_fuera_comidas === 'si' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué tipo de alimentos o bebidas?</label>
                  <input
                    type="text"
                    placeholder="Ej: Galletas, frutas, gaseosas, café..."
                    value={formData.habitos_alimenticios.que_alimentos_fuera || ''}
                    onChange={(e) => handleChange('que_alimentos_fuera', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Con qué frecuencia?</label>
                  <input
                    type="text"
                    placeholder="Ej: 2-3 veces al día, solo por las tardes..."
                    value={formData.habitos_alimenticios.frecuencia_fuera || ''}
                    onChange={(e) => handleChange('frecuencia_fuera', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN: ALERGIAS Y PREFERENCIAS */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Alergias y Preferencias Alimentarias
          </h3>

          <div className="space-y-4">
            {/* Alergias */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Hay alimentos que no tolera o que le producen alergia?
              </label>
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="tiene_alergias"
                    value="si"
                    checked={formData.habitos_alimenticios.tiene_alergias === 'si'}
                    onChange={(e) => handleChange('tiene_alergias', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="tiene_alergias"
                    value="no"
                    checked={formData.habitos_alimenticios.tiene_alergias === 'no'}
                    onChange={(e) => handleChange('tiene_alergias', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>

              {formData.habitos_alimenticios.tiene_alergias === 'si' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué alimentos específicamente?</label>
                  <textarea
                    placeholder="Ej: Lactosa, gluten, frutos secos, mariscos..."
                    value={formData.habitos_alimenticios.alimentos_alergicos || ''}
                    onChange={(e) => handleChange('alimentos_alergicos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Preferencias */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué alimentos son sus preferidos?
                </label>
                <textarea
                  value={formData.habitos_alimenticios.alimentos_preferidos || ''}
                  onChange={(e) => handleChange('alimentos_preferidos', e.target.value)}
                  placeholder="Ej: Pasta, carnes, verduras..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué alimentos no son de su agrado?
                </label>
                <textarea
                  value={formData.habitos_alimenticios.alimentos_no_agrado || ''}
                  onChange={(e) => handleChange('alimentos_no_agrado', e.target.value)}
                  placeholder="Ej: Pescado, verduras verdes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN: SUPLEMENTOS Y ASPECTOS EMOCIONALES */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-purple-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Suplementos y Aspectos Emocionales
          </h3>

          <div className="space-y-4">
            {/* Suplementos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Toma algún suplemento vitamínico y/o mineral?
              </label>
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="toma_suplementos"
                    value="si"
                    checked={formData.habitos_alimenticios.toma_suplementos === 'si'}
                    onChange={(e) => handleChange('toma_suplementos', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="toma_suplementos"
                    value="no"
                    checked={formData.habitos_alimenticios.toma_suplementos === 'no'}
                    onChange={(e) => handleChange('toma_suplementos', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>

              {formData.habitos_alimenticios.toma_suplementos === 'si' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuáles suplementos?</label>
                  <input
                    type="text"
                    placeholder="Ej: Vitamina D, Calcio, Multivitamínico..."
                    value={formData.habitos_alimenticios.que_suplementos || ''}
                    onChange={(e) => handleChange('que_suplementos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Estado emocional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Su consumo de alimentos interfiere en su estado emocional?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="interfiere_emocional"
                    value="si"
                    checked={formData.habitos_alimenticios.interfiere_emocional === 'si'}
                    onChange={(e) => handleChange('interfiere_emocional', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="interfiere_emocional"
                    value="no"
                    checked={formData.habitos_alimenticios.interfiere_emocional === 'no'}
                    onChange={(e) => handleChange('interfiere_emocional', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Por ejemplo: ansiedad, tristeza, culpa al comer ciertos alimentos</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN: HÁBITOS DE PREPARACIÓN Y CONSUMO */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-indigo-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            Hábitos de Preparación y Consumo
          </h3>

          <div className="space-y-4">
            {/* Preparación de comida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Qué utiliza en casa para preparar su comida?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['margarina', 'aceite vegetal', 'manteca'].map(grasa => (
                  <label key={grasa} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.habitos_alimenticios[`usa_${grasa.replace(' ', '_')}`] || false}
                      onChange={(e) => handleChange(`usa_${grasa.replace(' ', '_')}`, e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{grasa}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Agrega sal a la comida ya preparada?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="agrega_sal"
                    value="si"
                    checked={formData.habitos_alimenticios.agrega_sal === 'si'}
                    onChange={(e) => handleChange('agrega_sal', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="agrega_sal"
                    value="no"
                    checked={formData.habitos_alimenticios.agrega_sal === 'no'}
                    onChange={(e) => handleChange('agrega_sal', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN: HIDRATACIÓN Y BEBIDAS */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-cyan-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            Hidratación y Bebidas
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Agua */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuántos vasos de agua natural bebe al día?
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.habitos_alimenticios.vasos_agua || ''}
                onChange={(e) => handleChange('vasos_agua', e.target.value)}
                placeholder="Ej: 6, 8, 10..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Un vaso equivale aproximadamente a 250ml</p>
            </div>

            {/* Bebidas industriales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuántos vasos de bebidas industriales bebe al día?
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.habitos_alimenticios.vasos_bebidas_industriales || ''}
                onChange={(e) => handleChange('vasos_bebidas_industriales', e.target.value)}
                placeholder="Ej: 1, 2, 3..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Refrescos, jugos comerciales, bebidas azucaradas</p>
            </div>

            {/* Café */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Consume café?
              </label>
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="consume_cafe"
                    value="si"
                    checked={formData.habitos_alimenticios.consume_cafe === 'si'}
                    onChange={(e) => handleChange('consume_cafe', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="consume_cafe"
                    value="no"
                    checked={formData.habitos_alimenticios.consume_cafe === 'no'}
                    onChange={(e) => handleChange('consume_cafe', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>

              {formData.habitos_alimenticios.consume_cafe === 'si' && (
                <input
                  type="text"
                  placeholder="¿Cuántas veces en la semana?"
                  value={formData.habitos_alimenticios.frecuencia_cafe || ''}
                  onChange={(e) => handleChange('frecuencia_cafe', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Alcohol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Consume alcohol?
              </label>
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="consume_alcohol"
                    value="si"
                    checked={formData.habitos_alimenticios.consume_alcohol === 'si'}
                    onChange={(e) => handleChange('consume_alcohol', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="consume_alcohol"
                    value="no"
                    checked={formData.habitos_alimenticios.consume_alcohol === 'no'}
                    onChange={(e) => handleChange('consume_alcohol', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>

              {formData.habitos_alimenticios.consume_alcohol === 'si' && (
                <input
                  type="text"
                  placeholder="¿Con qué frecuencia?"
                  value={formData.habitos_alimenticios.frecuencia_alcohol || ''}
                  onChange={(e) => handleChange('frecuencia_alcohol', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Mate o tereré */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Consume mate o tereré?
              </label>
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="consume_mate"
                    value="si"
                    checked={formData.habitos_alimenticios.consume_mate === 'si'}
                    onChange={(e) => handleChange('consume_mate', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SÍ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="consume_mate"
                    value="no"
                    checked={formData.habitos_alimenticios.consume_mate === 'no'}
                    onChange={(e) => handleChange('consume_mate', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>

              {formData.habitos_alimenticios.consume_mate === 'si' && (
                <input
                  type="text"
                  placeholder="¿Con qué frecuencia? Ej: Todos los días, solo fines de semana..."
                  value={formData.habitos_alimenticios.frecuencia_mate || ''}
                  onChange={(e) => handleChange('frecuencia_mate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};


const IndicadoresDietariosStep = ({ formData, setFormData, onNext, onBack, onSave, loading }) => {
  const [recordatorio24h, setRecordatorio24h] = useState([]);
  const [nuevaComida, setNuevaComida] = useState({
    comida: '',
    hora: '',
    preparacion: '',
    cantidades_aproximadas: ''
  });
  const [frecuenciaConsumo, setFrecuenciaConsumo] = useState({});

  // Tiempos de comida según el modelo
  const tiemposComida = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'];
  
  // Lista de alimentos según el modelo
  const alimentos = [
    'Leche',
    'Queso',
    'Carnes rojas',
    'Pollo',
    'Pescado',
    'Huevo',
    'Verduras',
    'Aceites/Manteca/margarina',
    'Frutas',
    'Fideos/arroz',
    'Legumbres',
    'Pan',
    'Dulces',
    'Azúcar',
    'Agua'
  ];

  // Opciones de frecuencia según el modelo
  const frecuenciaOpciones = [
    { value: 'diario', label: 'A diario' },
    { value: 'vez_semana', label: 'Vez por semana' },
    { value: 'ocasionalmente', label: 'Ocasionalmente' },
    { value: 'nunca', label: 'Nunca' }
  ];

  useEffect(() => {
    // Cargar datos existentes si los hay
    if (formData.indicadores_dietarios?.recordatorio_24h) {
      setRecordatorio24h(formData.indicadores_dietarios.recordatorio_24h);
    }
    if (formData.indicadores_dietarios?.frecuencia_consumo) {
      setFrecuenciaConsumo(formData.indicadores_dietarios.frecuencia_consumo);
    }
  }, []);

  const agregarComida = () => {
    if (nuevaComida.comida && nuevaComida.preparacion) {
      const comidaCompleta = {
        ...nuevaComida,
        id: Date.now()
      };
      setRecordatorio24h([...recordatorio24h, comidaCompleta]);
      setNuevaComida({
        comida: '',
        hora: '',
        preparacion: '',
        cantidades_aproximadas: ''
      });
    }
  };

  const eliminarComida = (id) => {
    setRecordatorio24h(recordatorio24h.filter(c => c.id !== id));
  };

  const handleFrecuenciaChange = (alimento, frecuencia) => {
    setFrecuenciaConsumo({
      ...frecuenciaConsumo,
      [alimento]: frecuencia
    });
  };

  const handleNext = () => {
    setFormData({
      ...formData,
      indicadores_dietarios: {
        recordatorio_24h: recordatorio24h,
        frecuencia_consumo: frecuenciaConsumo
      }
    });
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-purple-700">Indicadores Dietarios</h2>
      
      {/* Sección 1: Recordatorio 24 horas */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-6 h-6 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Recordatorio 24 Horas (Día Atípico)
        </h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <p className="text-sm text-blue-700">
            <strong>Instrucción:</strong> Registre todos los alimentos y bebidas consumidos durante las últimas 24 horas, 
            incluyendo horarios, cantidades y lugar donde consumió los alimentos.
          </p>
        </div>

        {/* Formulario para agregar comida */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comida *</label>
              <select
                value={nuevaComida.comida}
                onChange={(e) => setNuevaComida({...nuevaComida, comida: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccione...</option>
                {tiemposComida.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                type="time"
                value={nuevaComida.hora}
                onChange={(e) => setNuevaComida({...nuevaComida, hora: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Preparación *</label>
              <textarea
                value={nuevaComida.preparacion}
                onChange={(e) => setNuevaComida({...nuevaComida, preparacion: e.target.value})}
                placeholder="Ej: Café con leche, pan integral tostado con queso blanco..."
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidades aproximadas</label>
              <input
                type="text"
                value={nuevaComida.cantidades_aproximadas}
                onChange={(e) => setNuevaComida({...nuevaComida, cantidades_aproximadas: e.target.value})}
                placeholder="Ej: 1 taza (250ml), 2 rebanadas, 1 plato mediano..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <button
            onClick={agregarComida}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Agregar comida
          </button>
        </div>

        {/* Lista de comidas registradas */}
        {recordatorio24h.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Comida</th>
                  <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Hora</th>
                  <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Preparación</th>
                  <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Cantidades aproximadas</th>
                  <th className="px-4 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recordatorio24h.map(comida => (
                  <tr key={comida.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-900">{comida.comida}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">{comida.hora || '-'}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-800">{comida.preparacion}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">{comida.cantidades_aproximadas || '-'}</td>
                    <td className="px-4 py-3 border-b border-gray-200 text-center">
                      <button
                        onClick={() => eliminarComida(comida.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección 2: Frecuencia de Consumo */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-6 h-6 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Frecuencia de Consumo de Alimentos
        </h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <p className="text-sm text-blue-700">
            <strong>Instrucción:</strong> Indique con qué frecuencia el paciente consume los siguientes alimentos.
          </p>
          </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Alimento</th>
                <th className="px-4 py-3 border-b border-gray-300 text-center text-sm font-semibold text-gray-700">A diario</th>
                <th className="px-4 py-3 border-b border-gray-300 text-center text-sm font-semibold text-gray-700">Vez por semana</th>
                <th className="px-4 py-3 border-b border-gray-300 text-center text-sm font-semibold text-gray-700">Ocasionalmente</th>
                <th className="px-4 py-3 border-b border-gray-300 text-center text-sm font-semibold text-gray-700">Nunca</th>
              </tr>
            </thead>
            <tbody>
              {alimentos.map(alimento => (
                <tr key={alimento} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-900 font-medium">{alimento}</td>
                  {frecuenciaOpciones.map(opcion => (
                    <td key={opcion.value} className="px-4 py-3 border-b border-gray-200 text-center">
                      <input
                        type="radio"
                        name={`freq_${alimento}`}
                        value={opcion.value}
                        checked={frecuenciaConsumo[alimento] === opcion.value}
                        onChange={() => handleFrecuenciaChange(alimento, opcion.value)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Navegación */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Anterior
        </button>
        <button 
          onClick={handleNext} 
          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
        >
          Siguiente
          <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const DatosCalculadoraStep = ({ formData, setFormData, onNext, onBack, onSave, loading }) => {
  const [datosCalculadora, setDatosCalculadora] = useState({
    peso_kg: '',
    talla_cm: '',
    talla_m: '',
    cintura_cm: '',
    cadera_cm: '',
    pliegue_tricipital_mm: '',
    pliegue_subescapular_mm: '',
    pliegue_suprailiaco_mm: '',
    actividad_fisica_nivel: '',
    get_peso_kg: '',
    get_talla_cm: '',
    get_edad: '',
    get_sexo: '',
    porcentaje_grasa_input: '',
    metodo_porcentaje_grasa: ''
  });

  useEffect(() => {
    if (formData.datos_para_calculadora) {
      setDatosCalculadora(formData.datos_para_calculadora);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosCalculadora({
      ...datosCalculadora,
      [name]: value
    });
  };

  const handleNext = () => {
    setFormData({
      ...formData,
      datos_para_calculadora: datosCalculadora
    });
    onNext();
  };

  const nivelesActividad = [
    { value: 'sedentario', label: 'Sedentario (poco o ningún ejercicio)' },
    { value: 'ligero', label: 'Actividad ligera (ejercicio 1-3 días/semana)' },
    { value: 'moderado', label: 'Actividad moderada (ejercicio 3-5 días/semana)' },
    { value: 'activo', label: 'Actividad intensa (ejercicio 6-7 días/semana)' },
    { value: 'muy_activo', label: 'Muy activo (ejercicio intenso diario)' }
  ];

  const metodosPorcentajeGrasa = [
    'Bioimpedancia',
    'Plicometría',
    'DEXA',
    'Pesaje hidrostático',
    'Otro'
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-blue-700">Datos para Calculadora</h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-sm text-blue-700">
          <strong>Nota:</strong> Esta sección captura los datos necesarios para el módulo Calculadora. 
          Los cálculos se realizarán en una sección separada.
        </p>
      </div>

      <div className="space-y-6">
        {/* Sección 1: Medidas Antropométricas Básicas */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
            Medidas Antropométricas Básicas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                name="peso_kg"
                value={datosCalculadora.peso_kg}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 70.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
          </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Talla (cm)
              </label>
              <input
                type="number"
                name="talla_cm"
                value={datosCalculadora.talla_cm}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 165.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Talla (metros)
              </label>
              <input
                type="number"
                name="talla_m"
                value={datosCalculadora.talla_m}
                onChange={handleChange}
                step="0.01"
                placeholder="Ej: 1.65"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
        </div>
      </div>
      
        {/* Sección 2: Circunferencias */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            Circunferencias
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Circunferencia de cintura (cm)
              </label>
              <input
                type="number"
                name="cintura_cm"
                value={datosCalculadora.cintura_cm}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 85.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Circunferencia de cadera (cm)
              </label>
              <input
                type="number"
                name="cadera_cm"
                value={datosCalculadora.cadera_cm}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 95.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Pliegues Cutáneos */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
            Pliegues Cutáneos (mm)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pliegue tricipital
              </label>
              <input
                type="number"
                name="pliegue_tricipital_mm"
                value={datosCalculadora.pliegue_tricipital_mm}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 15.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pliegue subescapular
              </label>
              <input
                type="number"
                name="pliegue_subescapular_mm"
                value={datosCalculadora.pliegue_subescapular_mm}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 12.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pliegue suprailíaco
              </label>
              <input
                type="number"
                name="pliegue_suprailiaco_mm"
                value={datosCalculadora.pliegue_suprailiaco_mm}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 18.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 4: Datos para GET (Gasto Energético Total) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Datos para GET (Gasto Energético Total)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de actividad física
              </label>
              <select
                name="actividad_fisica_nivel"
                value={datosCalculadora.actividad_fisica_nivel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione el nivel de actividad...</option>
                {nivelesActividad.map(nivel => (
                  <option key={nivel.value} value={nivel.value}>{nivel.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso para GET (kg)
              </label>
              <input
                type="number"
                name="get_peso_kg"
                value={datosCalculadora.get_peso_kg}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 70.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Talla para GET (cm)
              </label>
              <input
                type="number"
                name="get_talla_cm"
                value={datosCalculadora.get_talla_cm}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 165.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad (años)
              </label>
              <input
                type="number"
                name="get_edad"
                value={datosCalculadora.get_edad}
                onChange={handleChange}
                placeholder="Ej: 35"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo
              </label>
              <select
                name="get_sexo"
                value={datosCalculadora.get_sexo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección 5: Porcentaje de Grasa Corporal */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Porcentaje de Grasa Corporal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje de grasa (%)
              </label>
              <input
                type="number"
                name="porcentaje_grasa_input"
                value={datosCalculadora.porcentaje_grasa_input}
                onChange={handleChange}
                step="0.1"
                placeholder="Ej: 22.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de medición
              </label>
              <select
                name="metodo_porcentaje_grasa"
                value={datosCalculadora.metodo_porcentaje_grasa}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione el método...</option>
                {metodosPorcentajeGrasa.map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Anterior
        </button>
        <button 
          onClick={handleNext} 
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          Siguiente
          <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const ResumenStep = ({ formData, paciente, onSubmit, onBack, loading }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-green-700">Resumen y Confirmación</h2>
      
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <p className="text-sm text-green-700">
          <strong>Revise la información capturada antes de guardar.</strong> Puede regresar a cualquier sección para realizar cambios.
        </p>
      </div>

      {/* Información del Paciente */}
      {paciente && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Información del Paciente
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Nombre completo:</span>
              <p className="text-gray-900">{paciente.nombre} {paciente.apellido}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">DNI:</span>
              <p className="text-gray-900">{paciente.dni}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Historia Clínica */}
      {formData.historia_clinica && Object.keys(formData.historia_clinica).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm3.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 7.414V13a1 1 0 11-2 0V7.414L7.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Historia Clínica
          </h3>
          <div className="space-y-3">
            {formData.historia_clinica.antecedentes_familiares?.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Antecedentes familiares:</span>
                <p className="text-gray-900">{formData.historia_clinica.antecedentes_familiares.join(', ')}</p>
      </div>
            )}
            {formData.historia_clinica.enfermedades_actuales?.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Enfermedades actuales:</span>
                <p className="text-gray-900">{formData.historia_clinica.enfermedades_actuales.join(', ')}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-600">Modificó dieta:</span>
              <p className="text-gray-900">{formData.historia_clinica.modifico_dieta || 'NO'}</p>
            </div>
            {formData.historia_clinica.medicacion_usa === 'SI' && (
              <div>
                <span className="text-sm font-medium text-gray-600">Medicación:</span>
                <p className="text-gray-900">{formData.historia_clinica.medicacion_detalle || 'Sin detalles'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hábitos Alimenticios */}
      {formData.habitos_alimenticios && Object.keys(formData.habitos_alimenticios).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Hábitos Alimenticios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.habitos_alimenticios.comidas_por_dia && (
              <div>
                <span className="text-sm font-medium text-gray-600">Comidas por día:</span>
                <p className="text-gray-900">{formData.habitos_alimenticios.comidas_por_dia}</p>
              </div>
            )}
            {formData.habitos_alimenticios.agua_vasos_dia && (
              <div>
                <span className="text-sm font-medium text-gray-600">Vasos de agua al día:</span>
                <p className="text-gray-900">{formData.habitos_alimenticios.agua_vasos_dia}</p>
              </div>
            )}
            {formData.habitos_alimenticios.actividad_fisica_usa && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Actividad física:</span>
                <p className="text-gray-900">
                  {formData.habitos_alimenticios.actividad_fisica_usa === 'SI' 
                    ? `${formData.habitos_alimenticios.actividad_fisica_tipo || 'Sí'} - ${formData.habitos_alimenticios.actividad_fisica_frecuencia || ''}`
                    : 'No'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Indicadores Dietarios */}
      {formData.indicadores_dietarios && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Indicadores Dietarios
          </h3>
          <div className="space-y-3">
            {formData.indicadores_dietarios.recordatorio_24h?.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Recordatorio 24h:</span>
                <p className="text-gray-900">{formData.indicadores_dietarios.recordatorio_24h.length} comida(s) registrada(s)</p>
              </div>
            )}
            {formData.indicadores_dietarios.frecuencia_consumo && Object.keys(formData.indicadores_dietarios.frecuencia_consumo).length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Frecuencia de consumo:</span>
                <p className="text-gray-900">{Object.keys(formData.indicadores_dietarios.frecuencia_consumo).length} alimento(s) evaluado(s)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Datos para Calculadora */}
      {formData.datos_para_calculadora && Object.keys(formData.datos_para_calculadora).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Datos para Calculadora
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.datos_para_calculadora.peso_kg && (
              <div>
                <span className="text-sm font-medium text-gray-600">Peso:</span>
                <p className="text-gray-900">{formData.datos_para_calculadora.peso_kg} kg</p>
              </div>
            )}
            {formData.datos_para_calculadora.talla_cm && (
              <div>
                <span className="text-sm font-medium text-gray-600">Talla:</span>
                <p className="text-gray-900">{formData.datos_para_calculadora.talla_cm} cm</p>
              </div>
            )}
            {formData.datos_para_calculadora.cintura_cm && (
              <div>
                <span className="text-sm font-medium text-gray-600">Cintura:</span>
                <p className="text-gray-900">{formData.datos_para_calculadora.cintura_cm} cm</p>
              </div>
            )}
            {formData.datos_para_calculadora.cadera_cm && (
              <div>
                <span className="text-sm font-medium text-gray-600">Cadera:</span>
                <p className="text-gray-900">{formData.datos_para_calculadora.cadera_cm} cm</p>
              </div>
            )}
            {formData.datos_para_calculadora.actividad_fisica_nivel && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Nivel de actividad:</span>
                <p className="text-gray-900 capitalize">{formData.datos_para_calculadora.actividad_fisica_nivel.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button 
          onClick={onBack} 
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Anterior
        </button>
        <button 
          onClick={onSubmit} 
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Guardar Formulario
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FormularioCaptura;
