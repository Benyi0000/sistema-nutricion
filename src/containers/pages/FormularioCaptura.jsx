import React, { useState, useEffect } from 'react';
import { formularioAPI } from '../../lib/api';


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
      alert('Formulario capturado exitosamente');
      console.log('Respuesta:', response.data);
    } catch (err) {
      setError('Error al capturar formulario');
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
            />
          )}
          
          {currentStep === 2 && (
            <HabitosAlimenticiosStep 
              formData={formData} 
              setFormData={setFormData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          
          {currentStep === 3 && (
            <IndicadoresDietariosStep 
              formData={formData} 
              setFormData={setFormData}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}
          
          {currentStep === 4 && (
            <DatosCalculadoraStep 
              formData={formData} 
              setFormData={setFormData}
              onNext={() => setCurrentStep(5)}
              onBack={() => setCurrentStep(3)}
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
const HistoriaClinicaStep = ({ formData, setFormData, onNext, onBack }) => {
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

const HabitosAlimenticiosStep = ({ formData, setFormData, onNext, onBack }) => {
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


const IndicadoresDietariosStep = ({ formData, setFormData, onNext, onBack }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Indicadores Dietarios</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Próximamente</h3>
            <p className="text-yellow-700 mt-1">
              Esta sección estará disponible en próximas versiones. Aquí se capturará información sobre:
            </p>
            <ul className="text-yellow-700 mt-2 list-disc list-inside">
              <li>Recordatorio 24 horas (día atípico)</li>
              <li>Frecuencia de consumo de alimentos</li>
              <li>Matriz de consumo por categorías</li>
              <li>Hábitos alimentarios específicos</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Anterior
        </button>
        <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Siguiente
        </button>
      </div>
    </div>
  );
};

const DatosCalculadoraStep = ({ formData, setFormData, onNext, onBack }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Datos para Calculadora</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Próximamente</h3>
            <p className="text-yellow-700 mt-1">
              Esta sección estará disponible en próximas versiones. Aquí se capturará información para el módulo Calculadora:
            </p>
            <ul className="text-yellow-700 mt-2 list-disc list-inside">
              <li>Medidas antropométricas (peso, talla)</li>
              <li>Circunferencias (cintura, cadera)</li>
              <li>Pliegues cutáneos (tríceps, subescapular, suprailíaco)</li>
              <li>Datos para GET (Gasto Energético Total)</li>
              <li>Porcentaje de grasa corporal</li>
            </ul>
            <p className="text-yellow-600 text-sm mt-2 font-medium">
              Nota: Solo se capturarán los datos, no se realizarán cálculos automáticamente.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Anterior
        </button>
        <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Siguiente
        </button>
      </div>
    </div>
  );
};

const ResumenStep = ({ formData, paciente, onSubmit, onBack, loading }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Resumen</h2>
      
      {paciente && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium">Paciente:</h3>
          <p>{paciente.nombre} {paciente.apellido} (DNI: {paciente.dni})</p>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Datos capturados:</h3>
        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
      
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Anterior
        </button>
        <button 
          onClick={onSubmit} 
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Guardando...' : 'Guardar Formulario'}
        </button>
      </div>
    </div>
  );
};

export default FormularioCaptura;
