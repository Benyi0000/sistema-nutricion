// src/containers/pages/nutricionista/PlantillaFormPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  useGetPlantillaQuery,
  useCreatePlantillaMutation,
  useUpdatePlantillaMutation,
} from '../../../features/plantillas/plantillasSlice';
import { useGetPreguntasQuery, useCreatePreguntaMutation } from '../../../features/preguntas/preguntasSlice';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const PlantillaFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: plantilla, isLoading: isLoadingPlantilla } = useGetPlantillaQuery(id, {
    skip: !isEditing,
  });

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_consulta: 'INICIAL',
    es_predeterminada: false,
    activo: true,
    config: {},
  });

  // Cargar preguntas según el tipo de consulta seleccionado
  const scope = formData.tipo_consulta === 'INICIAL' ? 'inicial' : 'seguimiento';
  const { data: preguntasDisponibles, isLoading: isLoadingPreguntas } = useGetPreguntasQuery({ scope });

  const [createPlantilla, { isLoading: isCreating }] = useCreatePlantillaMutation();
  const [updatePlantilla, { isLoading: isUpdating }] = useUpdatePlantillaMutation();
  const [createPregunta, { isLoading: isCreatingPregunta }] = useCreatePreguntaMutation();

  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState([]);
  const [errors, setErrors] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [newCategoriaName, setNewCategoriaName] = useState('');
  const [categoriaFormError, setCategoriaFormError] = useState('');
  const [editingCategoriaId, setEditingCategoriaId] = useState(null);
  const [editingCategoriaName, setEditingCategoriaName] = useState('');
  const [editingCategoriaError, setEditingCategoriaError] = useState('');

  // Estados para el modal de nueva pregunta
  const [showModalNuevaPregunta, setShowModalNuevaPregunta] = useState(false);
  const [nuevaPreguntaForm, setNuevaPreguntaForm] = useState({
    texto: '',
    tipo: 'text',
    codigo: '',
    requerido: false,
    unidad: '',
    opciones: [],
  });
  const [opcionTemporal, setOpcionTemporal] = useState('');
  const [errorsNuevaPregunta, setErrorsNuevaPregunta] = useState({});

  const normalizeCategorias = (rawCats) => {
    if (!Array.isArray(rawCats)) return [];

    const vistos = new Set();
    const normalizadas = [];

    rawCats.forEach((cat, index) => {
      let categoriaNormalizada = null;

      if (typeof cat === 'string') {
        const id = String(cat).trim();
        if (!id) return;
        categoriaNormalizada = {
          id,
          nombre: cat,
          orden: index,
        };
      } else if (cat && typeof cat === 'object') {
        const nombreCrudo =
          cat.nombre ??
          cat.label ??
          cat.titulo ??
          cat.name ??
          cat.title ??
          '';

        const resolvedId =
          cat.id ??
          cat.temp_id ??
          cat.key ??
          nombreCrudo ??
          `cat-${index}`;

        const id = String(resolvedId).trim();
        if (!id) return;

        const nombre = String(nombreCrudo || id).trim() || id;

        categoriaNormalizada = {
          id,
          nombre,
          orden: cat.orden ?? index,
        };
      }

      if (categoriaNormalizada && !vistos.has(categoriaNormalizada.id)) {
        vistos.add(categoriaNormalizada.id);
        normalizadas.push(categoriaNormalizada);
      }
    });

    return normalizadas
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((cat, idx) => ({ ...cat, orden: idx }));
  };

  const inferCategoriasDesdePreguntas = (preguntas = []) => {
    const map = new Map();

    preguntas.forEach((pc) => {
      const rawCategoria = pc?.config?.categoria;
      if (rawCategoria === null || rawCategoria === undefined || rawCategoria === '') return;

      const id = String(rawCategoria).trim();
      if (!id || map.has(id)) return;

      const nombre =
        pc?.config?.categoria_nombre ??
        pc?.config?.categoriaNombre ??
        pc?.config?.categoria_label ??
        pc?.config?.categoriaLabel ??
        id;

      map.set(id, {
        id,
        nombre: String(nombre || id).trim() || id,
        orden: map.size,
      });
    });

    return Array.from(map.values());
  };

  useEffect(() => {
    if (plantilla && isEditing) {
      setEditingCategoriaId(null);
      setEditingCategoriaName('');
      setEditingCategoriaError('');

      setFormData({
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        tipo_consulta: plantilla.tipo_consulta,
        es_predeterminada: plantilla.es_predeterminada,
        activo: plantilla.activo,
        config: plantilla.config || {},
      });

      let categoriasConfig = normalizeCategorias(plantilla.config?.categorias);

      if (categoriasConfig.length === 0) {
        const inferidas = normalizeCategorias(
          inferCategoriasDesdePreguntas(plantilla.preguntas_config)
        );
        if (inferidas.length > 0) {
          categoriasConfig = inferidas;
        }
      }
      setCategorias(categoriasConfig);

      const categoriaIds = new Set(categoriasConfig.map((cat) => cat.id));

      // Cargar preguntas de la plantilla
      if (plantilla.preguntas_config) {
        setPreguntasSeleccionadas(
          plantilla.preguntas_config.map((pc) => ({
            pregunta_id: pc.pregunta.id,
            pregunta: pc.pregunta,
            orden: pc.orden,
            requerido_en_plantilla: pc.requerido_en_plantilla,
            visible: pc.visible,
            config: pc.config || {},
            categoriaId: (() => {
              const rawCategoria = pc.config?.categoria ?? null;
              if (rawCategoria === null || rawCategoria === undefined) return null;
              const normalized = String(rawCategoria);
              return categoriaIds.has(normalized) ? normalized : null;
            })(),
          }))
        );
      }
    }
  }, [plantilla, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddPregunta = (pregunta) => {
    if (preguntasSeleccionadas.some((p) => p.pregunta_id === pregunta.id)) {
      return; // Ya está agregada
    }

    setPreguntasSeleccionadas((prev) => [
      ...prev,
      {
        pregunta_id: pregunta.id,
        pregunta: pregunta,
        orden: prev.length,
        requerido_en_plantilla: pregunta.requerido,
        visible: true,
        config: {},
        categoriaId: null,
      },
    ]);
  };

  const handleRemovePregunta = (preguntaId) => {
    setPreguntasSeleccionadas((prev) =>
      prev.filter((p) => p.pregunta_id !== preguntaId).map((p, i) => ({ ...p, orden: i }))
    );
  };

  const handleTogglePreguntaConfig = (preguntaId, field) => {
    setPreguntasSeleccionadas((prev) =>
      prev.map((p) =>
        p.pregunta_id === preguntaId ? { ...p, [field]: !p[field] } : p
      )
    );
  };

  const handleChangeCategoriaPregunta = (preguntaId, nuevaCategoriaId) => {
    setPreguntasSeleccionadas((prev) =>
      prev.map((p) =>
        p.pregunta_id === preguntaId
          ? { ...p, categoriaId: nuevaCategoriaId === 'root' ? null : nuevaCategoriaId }
          : p
      )
    );
  };

  const handleAddCategoria = () => {
    setShowCategoriaForm(true);
    setCategoriaFormError('');
    setNewCategoriaName('');
  };

  const handleSaveCategoria = () => {
    const trimmed = newCategoriaName.trim();
    if (!trimmed) {
      setCategoriaFormError('El nombre es obligatorio.');
      return;
    }

    if (categorias.some((cat) => cat.nombre.toLowerCase() === trimmed.toLowerCase())) {
      setCategoriaFormError('Ya existe una categoría con ese nombre.');
      return;
    }

    setCategorias((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        nombre: trimmed,
        orden: prev.length,
      },
    ]);
    setNewCategoriaName('');
    setShowCategoriaForm(false);
  };

  const handleCancelCategoria = () => {
    setShowCategoriaForm(false);
    setNewCategoriaName('');
    setCategoriaFormError('');
  };

  const handleRemoveCategoria = (categoriaId) => {
    if (editingCategoriaId === categoriaId) {
      setEditingCategoriaId(null);
      setEditingCategoriaName('');
      setEditingCategoriaError('');
    }
    setCategorias((prev) =>
      prev
        .filter((cat) => cat.id !== categoriaId)
        .map((cat, index) => ({ ...cat, orden: index }))
    );
    setPreguntasSeleccionadas((prev) =>
      prev.map((item) =>
        item.categoriaId === categoriaId
          ? { ...item, categoriaId: null }
          : item
      )
    );
  };

  const handleStartEditCategoria = (categoria) => {
    setEditingCategoriaId(categoria.id);
    setEditingCategoriaName(categoria.nombre);
    setEditingCategoriaError('');
  };

  const handleCancelEditCategoria = () => {
    setEditingCategoriaId(null);
    setEditingCategoriaName('');
    setEditingCategoriaError('');
  };

  const handleSaveEditCategoria = (categoriaId) => {
    const trimmed = editingCategoriaName.trim();

    if (!trimmed) {
      setEditingCategoriaError('El nombre es obligatorio.');
      return;
    }

    if (
      categorias.some(
        (cat) =>
          cat.id !== categoriaId && cat.nombre.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setEditingCategoriaError('Ya existe una categoría con ese nombre.');
      return;
    }

    setCategorias((prev) =>
      prev.map((cat) =>
        cat.id === categoriaId ? { ...cat, nombre: trimmed } : cat
      )
    );
    setEditingCategoriaId(null);
    setEditingCategoriaName('');
    setEditingCategoriaError('');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const rootPreguntas = preguntasSeleccionadas.filter((item) => !item.categoriaId);
    const rootIds = rootPreguntas.map((item) => item.pregunta_id);

    const sourceId = rootIds[result.source.index];
    const destId = rootIds[result.destination.index] || null;

    setPreguntasSeleccionadas((prev) => {
      const items = [...prev];
      const sourceIdx = items.findIndex((item) => item.pregunta_id === sourceId);
      if (sourceIdx === -1) return prev;

      const [moved] = items.splice(sourceIdx, 1);

      let destIdx = items.findIndex((item) => item.pregunta_id === destId);
      if (destIdx === -1) destIdx = items.length;

      items.splice(destIdx, 0, moved);
      return items.map((item, index) => ({ ...item, orden: index }));
    });
  };

  // Funciones para el modal de nueva pregunta
  const handleOpenModalNuevaPregunta = () => {
    console.log('Abriendo modal de nueva pregunta');
    setShowModalNuevaPregunta(true);
    setNuevaPreguntaForm({
      texto: '',
      tipo: 'text',
      codigo: '',
      requerido: false,
      unidad: '',
      opciones: [],
    });
    setOpcionTemporal('');
    setErrorsNuevaPregunta({});
  };

  const handleCloseModalNuevaPregunta = () => {
    setShowModalNuevaPregunta(false);
    setNuevaPreguntaForm({
      texto: '',
      tipo: 'text',
      codigo: '',
      requerido: false,
      unidad: '',
      opciones: [],
    });
    setOpcionTemporal('');
    setErrorsNuevaPregunta({});
  };

  const handleChangeNuevaPregunta = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevaPreguntaForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAgregarOpcion = () => {
    if (!opcionTemporal.trim()) return;
    
    setNuevaPreguntaForm((prev) => ({
      ...prev,
      opciones: [
        ...prev.opciones,
        {
          valor: opcionTemporal.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, ''),
          etiqueta: opcionTemporal.trim(),
        },
      ],
    }));
    setOpcionTemporal('');
  };

  const handleEliminarOpcion = (index) => {
    setNuevaPreguntaForm((prev) => ({
      ...prev,
      opciones: prev.opciones.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitNuevaPregunta = async (e) => {
    e.preventDefault();
    setErrorsNuevaPregunta({});

    try {
      const nuevaPregunta = await createPregunta(nuevaPreguntaForm).unwrap();
      
      // Agregar automáticamente a la plantilla
      handleAddPregunta(nuevaPregunta);
      
      // Cerrar modal
      handleCloseModalNuevaPregunta();
    } catch (err) {
      console.error('Error al crear pregunta:', err);
      setErrorsNuevaPregunta(err.data || { non_field_errors: ['Error al crear la pregunta'] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const categoriasPayload = categorias.map((cat, index) => ({
        id: cat.id,
        nombre: cat.nombre,
        orden: index,
      }));

      const data = {
        ...formData,
        config: {
          ...(formData.config || {}),
          categorias: categoriasPayload,
        },
        preguntas: preguntasSeleccionadas.map((p, index) => ({
          pregunta_id: p.pregunta_id,
          orden: index,
          requerido_en_plantilla: p.requerido_en_plantilla,
          visible: p.visible,
          config: {
            ...(p.config || {}),
            categoria: p.categoriaId || null,
          },
        })),
      };

      if (isEditing) {
        await updatePlantilla({ id, ...data }).unwrap();
      } else {
        await createPlantilla(data).unwrap();
      }

      navigate('/panel/nutri/plantillas');
    } catch (err) {
      console.error('Error al guardar plantilla:', err);
      setErrors(err.data || { non_field_errors: ['Error al guardar la plantilla'] });
    }
  };

  if (isLoadingPlantilla || isLoadingPreguntas) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const preguntasDisponiblesFiltradas = preguntasDisponibles?.filter(
    (p) => !preguntasSeleccionadas.some((ps) => ps.pregunta_id === p.id)
  ) || [];

  const preguntasAgrupadas = useMemo(() => {
    const mapa = new Map();
    categorias.forEach((cat) => mapa.set(cat.id, []));

    const sinCategoria = [];

    preguntasSeleccionadas
      .slice()
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .forEach((item) => {
        if (item.categoriaId && mapa.has(item.categoriaId)) {
          mapa.get(item.categoriaId).push(item);
        } else {
          sinCategoria.push(item);
        }
      });

    return {
      porCategoria: categorias.map((cat) => ({
        cat,
        preguntas: mapa.get(cat.id) || [],
      })),
      sinCategoria,
    };
  }, [preguntasSeleccionadas, categorias]);

  // Componente Modal como Portal
  const modalContent = showModalNuevaPregunta && createPortal(
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }} aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleCloseModalNuevaPregunta}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative" style={{ zIndex: 10000 }}>
          <form onSubmit={handleSubmitNuevaPregunta}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Crear Nueva Pregunta
                  </h3>
                  <div className="mt-4 space-y-4">
                    {/* Texto de la pregunta */}
                    <div>
                      <label htmlFor="nueva-texto" className="block text-sm font-medium text-gray-700">
                        Texto de la pregunta <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="nueva-texto"
                        name="texto"
                        value={nuevaPreguntaForm.texto}
                        onChange={handleChangeNuevaPregunta}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Ej: ¿Consume suplementos?"
                      />
                      {errorsNuevaPregunta.texto && (
                        <p className="mt-1 text-sm text-red-600">{errorsNuevaPregunta.texto[0]}</p>
                      )}
                    </div>

                    {/* Tipo */}
                    <div>
                      <label htmlFor="nueva-tipo" className="block text-sm font-medium text-gray-700">
                        Tipo <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="nueva-tipo"
                        name="tipo"
                        value={nuevaPreguntaForm.tipo}
                        onChange={handleChangeNuevaPregunta}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="text">Texto</option>
                        <option value="integer">Entero</option>
                        <option value="decimal">Decimal</option>
                        <option value="boolean">Sí/No</option>
                        <option value="date">Fecha</option>
                        <option value="single">Opción única</option>
                        <option value="multi">Opción múltiple</option>
                      </select>
                    </div>

                    {/* Código (opcional) */}
                    <div>
                      <label htmlFor="nueva-codigo" className="block text-sm font-medium text-gray-700">
                        Código (opcional)
                      </label>
                      <input
                        type="text"
                        id="nueva-codigo"
                        name="codigo"
                        value={nuevaPreguntaForm.codigo}
                        onChange={handleChangeNuevaPregunta}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Ej: suplementos"
                      />
                    </div>

                    {/* Unidad (opcional) */}
                    <div>
                      <label htmlFor="nueva-unidad" className="block text-sm font-medium text-gray-700">
                        Unidad (opcional)
                      </label>
                      <input
                        type="text"
                        id="nueva-unidad"
                        name="unidad"
                        value={nuevaPreguntaForm.unidad}
                        onChange={handleChangeNuevaPregunta}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Ej: kg, cm, veces/día"
                      />
                    </div>

                    {/* Opciones (solo para single/multi) */}
                    {(nuevaPreguntaForm.tipo === 'single' || nuevaPreguntaForm.tipo === 'multi') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opciones <span className="text-red-500">*</span>
                        </label>
                        
                        {/* Lista de opciones */}
                        {nuevaPreguntaForm.opciones.length > 0 && (
                          <div className="mb-2 space-y-1">
                            {nuevaPreguntaForm.opciones.map((opcion, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                                <span className="text-sm text-gray-700">{opcion.etiqueta}</span>
                                <button
                                  type="button"
                                  onClick={() => handleEliminarOpcion(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Agregar opción */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={opcionTemporal}
                            onChange={(e) => setOpcionTemporal(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAgregarOpcion();
                              }
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Escribir opción..."
                          />
                          <button
                            type="button"
                            onClick={handleAgregarOpcion}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Requerido */}
                    <div className="flex items-center">
                      <input
                        id="nueva-requerido"
                        name="requerido"
                        type="checkbox"
                        checked={nuevaPreguntaForm.requerido}
                        onChange={handleChangeNuevaPregunta}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="nueva-requerido" className="ml-2 block text-sm text-gray-700">
                        Pregunta requerida
                      </label>
                    </div>

                    {errorsNuevaPregunta.non_field_errors && (
                      <p className="text-sm text-red-600">{errorsNuevaPregunta.non_field_errors[0]}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="submit"
                disabled={isCreatingPregunta}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isCreatingPregunta ? 'Creando...' : 'Crear Pregunta'}
              </button>
              <button
                type="button"
                onClick={handleCloseModalNuevaPregunta}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );

  const renderPreguntaCard = (item, index, showCategoriaSelect = true, dragHandleProps) => (
    <div className="flex items-start gap-3">
      <div
        {...dragHandleProps}
        className={`mt-1 ${dragHandleProps ? 'cursor-move text-gray-400 hover:text-gray-600' : ''}`}
      >
        {dragHandleProps && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {index + 1}. {item.pregunta.texto}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-gray-200 rounded">
                {item.pregunta.tipo}
              </span>
              {item.pregunta.unidad && (
                <span>Unidad: {item.pregunta.unidad}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleRemovePregunta(item.pregunta_id)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={item.requerido_en_plantilla}
              onChange={() =>
                handleTogglePreguntaConfig(item.pregunta_id, 'requerido_en_plantilla')
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-gray-700">Requerida</span>
          </label>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={() => handleTogglePreguntaConfig(item.pregunta_id, 'visible')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-gray-700">Visible</span>
          </label>
          {showCategoriaSelect && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Categoría:</span>
              <select
                value={item.categoriaId || 'root'}
                onChange={(e) => handleChangeCategoriaPregunta(item.pregunta_id, e.target.value)}
                className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="root">Sin categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/panel/nutri/plantillas')}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a plantillas
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEditing
            ? 'Modifica la información y preguntas de la plantilla'
            : 'Crea una nueva plantilla reutilizable de preguntas'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Datos de la Plantilla */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Básica
              </h2>

              {/* Errores generales */}
              {errors.non_field_errors && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{errors.non_field_errors[0]}</p>
                </div>
              )}

              {/* Nombre */}
              <div className="mb-4">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.nombre ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Consulta Diabetes"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre[0]}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="mb-4">
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Descripción opcional"
                />
              </div>

              {/* Tipo de Consulta */}
              <div className="mb-4">
                <label htmlFor="tipo_consulta" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Consulta <span className="text-red-500">*</span>
                </label>
                <select
                  id="tipo_consulta"
                  name="tipo_consulta"
                  value={formData.tipo_consulta}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="INICIAL">Inicial</option>
                  <option value="SEGUIMIENTO">Seguimiento</option>
                </select>
              </div>

              {/* Predeterminada */}
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="es_predeterminada"
                    name="es_predeterminada"
                    type="checkbox"
                    checked={formData.es_predeterminada}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="es_predeterminada" className="ml-2 block text-sm text-gray-700">
                    Usar como predeterminada
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Se usará automáticamente en nuevas consultas de este tipo
                </p>
                {errors.es_predeterminada && (
                  <p className="mt-1 text-sm text-red-600">{errors.es_predeterminada[0]}</p>
                )}
              </div>

              {/* Activo */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    id="activo"
                    name="activo"
                    type="checkbox"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                    Plantilla activa
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isCreating || isUpdating || preguntasSeleccionadas.length === 0}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isCreating || isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isEditing ? 'Guardar Cambios' : 'Crear Plantilla'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/panel/nutri/plantillas')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
              </div>

              {preguntasSeleccionadas.length === 0 && (
                <p className="mt-4 text-xs text-amber-600 flex items-start">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Debes agregar al menos una pregunta
                </p>
              )}
            </div>
          </div>

          {/* Columna Derecha: Preguntas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preguntas Seleccionadas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Preguntas en la Plantilla ({preguntasSeleccionadas.length})
              </h2>

              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleAddCategoria}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Agregar categoría
                </button>
              </div>

              {showCategoriaForm && (
                <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-indigo-700 mb-2">Nueva categoría</h3>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={newCategoriaName}
                      onChange={(e) => setNewCategoriaName(e.target.value)}
                      className={`flex-1 rounded-md border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 text-sm ${categoriaFormError ? 'border-red-300' : 'border-indigo-200'}`}
                      placeholder="Ej: Hábitos alimentarios"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveCategoria}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelCategoria}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                  {categoriaFormError && (
                    <p className="mt-2 text-xs text-red-600">{categoriaFormError}</p>
                  )}
                </div>
              )}

              {preguntasAgrupadas.porCategoria.length > 0 && (
                <div className="space-y-4 mb-6">
                  {preguntasAgrupadas.porCategoria.map(({ cat, preguntas }) => (
                      <div key={cat.id} className="border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          {editingCategoriaId === cat.id ? (
                            <div className="flex-1 mr-3">
                              <input
                                type="text"
                                value={editingCategoriaName}
                                onChange={(e) => setEditingCategoriaName(e.target.value)}
                                className={`w-full rounded-md border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-2 py-1 ${
                                  editingCategoriaError ? 'border-red-300' : 'border-indigo-200'
                                }`}
                              />
                              {editingCategoriaError && (
                                <p className="mt-1 text-xs text-red-600">{editingCategoriaError}</p>
                              )}
                            </div>
                          ) : (
                            <h3 className="flex-1 text-base font-semibold text-indigo-700 mr-3">
                              {cat.nombre}
                            </h3>
                          )}
                          <div className="flex items-center gap-2">
                            {editingCategoriaId === cat.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCategoria(cat.id)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditCategoria}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCategoria(cat)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-md"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCategoria(cat.id)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {preguntas.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Aún no hay preguntas en esta categoría.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {preguntas.map((item, index) => (
                              <div key={item.pregunta_id} className="bg-gray-50 border rounded-lg p-4">
                                {renderPreguntaCard(item, index, false)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {preguntasSeleccionadas.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin preguntas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona preguntas del banco para agregarlas a la plantilla
                  </p>
                </div>
              ) : null}

              {preguntasAgrupadas.sinCategoria.length > 0 && (
                <div>
                  {preguntasAgrupadas.porCategoria.length > 0 && (
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                      Preguntas sin categoría
                    </h3>
                  )}
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="preguntas">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {preguntasAgrupadas.sinCategoria.map((item, index) => (
                            <Draggable key={item.pregunta_id} draggableId={String(item.pregunta_id)} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`bg-gray-50 border rounded-lg p-4 ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                >
                                  {renderPreguntaCard(item, index, true, provided.dragHandleProps)}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}
            </div>

            {/* Banco de Preguntas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Banco de Preguntas ({preguntasDisponiblesFiltradas.length} disponibles)
                </h2>
                <button
                  type="button"
                  onClick={handleOpenModalNuevaPregunta}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva Pregunta
                </button>
              </div>

              {preguntasDisponiblesFiltradas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Todas las preguntas han sido agregadas a la plantilla
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {preguntasDisponiblesFiltradas.map((pregunta) => (
                    <div
                      key={pregunta.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{pregunta.texto}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-200 rounded">{pregunta.tipo}</span>
                            {pregunta.unidad && <span>Unidad: {pregunta.unidad}</span>}
                            {pregunta.es_personalizada && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                                Personalizada
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddPregunta(pregunta)}
                          className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Renderizar modal con Portal */}
      {modalContent}
    </div>
  );
};

export default PlantillaFormPage;
