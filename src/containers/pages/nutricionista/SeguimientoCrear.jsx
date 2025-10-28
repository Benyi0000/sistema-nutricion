import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Combobox } from "@headlessui/react";
import { fetchPreguntasPersonalizadas, crearPreguntaPersonalizada } from "../../../features/preguntas/preguntasSlice.js";
import { useGetPlantillasQuery } from "../../../features/plantillas/plantillasSlice.js";
import PersonalizadaBuilder from "../../../components/consultas/PersonalizadaBuilder.jsx";


import {
    fetchConsultasPaciente,
    crearSeguimiento,
    } from "../../../features/consultas/consultasSlice";
    import { fetchPacienteById } from "../../../features/nutri/nutriSlice";
    import ObservationField from "../../../components/forms/ObservationField.jsx";
    import InputByType from "../../../components/consultas/InputByType.jsx";


    export default function SeguimientoCrear() {
    const { pacienteId } = useParams();
    const dispatch = useDispatch();

    // Store
    const { items: consultas, status, creating, error: errorStore } = useSelector((s) => s.consultas);
    const paciente = useSelector((s) => s.nutri.selected);
    const preguntasPersonalizadas = useSelector((s) => s.preguntas.byScope.personalizadas) || [];

    // RTK Query - Cargar plantillas de SEGUIMIENTO
    const { data: plantillas, isLoading: loadingPlantillas } = useGetPlantillasQuery({
        tipo_consulta: 'SEGUIMIENTO',
        activo: true,
    });

    // UI local
    const [valores, setValores] = useState({});
    const [obs, setObs] = useState({});
    const [seleccionadas, setSeleccionadas] = useState([]);
    const [query, setQuery] = useState("");
    const [nuevaPregunta, setNuevaPregunta] = useState("");

    // Estado para plantillas
    const [modoPlantilla, setModoPlantilla] = useState(false);
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
    const [plantillaSnapshot, setPlantillaSnapshot] = useState(null);

    // Mensajes UI
    const [uiError, setUiError] = useState("");
    const [uiOk, setUiOk] = useState("");

    // Carga inicial
    useEffect(() => {
        if (pacienteId) {
        dispatch(fetchPacienteById(pacienteId));
        dispatch(fetchConsultasPaciente(pacienteId));
        }
        dispatch(fetchPreguntasPersonalizadas()); 
    }, [pacienteId, dispatch]);

    // useEffect para cargar preguntas de plantilla seleccionada
    useEffect(() => {
        if (!modoPlantilla || !plantillaSeleccionada || !plantillas) return;
        
        const plantilla = plantillas.find(p => p.id === parseInt(plantillaSeleccionada));
        if (!plantilla || !plantilla.preguntas_config) return;

        // Generar snapshot
        const snapshot = {
            id: plantilla.id,
            nombre: plantilla.nombre,
            descripcion: plantilla.descripcion,
            tipo_consulta: plantilla.tipo_consulta,
            preguntas: plantilla.preguntas_config.map(pc => ({
                id: pc.pregunta.id,
                texto: pc.pregunta.texto,
                tipo: pc.pregunta.tipo, // El campo correcto es 'tipo', no 'tipo_dato'
                codigo: pc.pregunta.codigo,
                unidad: pc.pregunta.unidad,
                opciones: pc.pregunta.opciones,
                requerido: pc.requerido_en_plantilla || false,
                visible: pc.visible,
                orden: pc.orden,
            })),
        };
        setPlantillaSnapshot(snapshot);

        // Auto-seleccionar preguntas visibles
        const preguntasVisibles = snapshot.preguntas.filter(p => p.visible);
        setSeleccionadas(preguntasVisibles);
        
        // Limpiar valores y observaciones previas
        setValores({});
        setObs({});
    }, [modoPlantilla, plantillaSeleccionada, plantillas]);

    const cargando = status === "loading";

    const consultaInicial = Array.isArray(consultas)
        ? consultas.find((c) => c.tipo === "INICIAL") || null
        : null;

    const seguimientos = Array.isArray(consultas)
        ? consultas.filter((c) => c.tipo === "SEGUIMIENTO")
        : [];

    const preguntasDisponibles = [
    ...(consultaInicial?.plantilla_snapshot?.preguntas || []),
    ...preguntasPersonalizadas,
    ];

    // Filtrado de combobox (excluye ya seleccionadas)
    const idsSel = new Set(seleccionadas.map((p) => p.id));
    const preguntasFiltradas = (preguntasDisponibles || []).filter((q) => {
        if (idsSel.has(q.id)) return false;
        if (!query) return true;
        return (q.texto || "").toLowerCase().includes(query.toLowerCase());
    });

    const handlePlantillaChange = (e) => {
        const newValue = e.target.value;
        setPlantillaSeleccionada(newValue);
        // Limpiar estado al cambiar plantilla
        setSeleccionadas([]);
        setValores({});
        setObs({});
        setPlantillaSnapshot(null);
    };

    const agregarPregunta = (q) => {
        if (!q) return;
        if (!idsSel.has(q.id)) {
        setSeleccionadas((prev) => [...prev, q]);
        }
        setQuery("");
        setUiError("");
        setUiOk("");
    };

    const agregarPersonalizada = () => {
        if (!nuevaPregunta.trim()) return;
        const nueva = {
        id: Date.now(), // id temporal front
        texto: nuevaPregunta.trim(),
        tipo: "short_text",
        codigo: null,
        unidad: null,
        es_personalizada: true,
        requerido: false,
        };
        setSeleccionadas((prev) => [...prev, nueva]);
        setNuevaPregunta("");
        setUiError("");
        setUiOk("");
    };

    const setVal = (id, v) => setValores((prev) => ({ ...prev, [id]: v }));
    const setObFn = (id, v) => setObs((prev) => ({ ...prev, [id]: v }));

    // -------- Helpers de validación/serialización ----------
    const buildRespuestas = () =>
        (seleccionadas || []).map((q) => ({
        pregunta: q.texto,
        tipo: q.tipo,
        codigo: q.codigo || null,
        unidad: q.unidad || null,
        valor: valores[q.id] ?? null,
        observacion: (obs[q.id] && obs[q.id].trim().length) ? obs[q.id].trim() : null,
        personalizada: q.es_personalizada || false,
        requerido: !!q.requerido,
        _id: q.id, // sólo para validar, no se envía (lo quitamos abajo)
        }));

    const validateRespuestas = (resps) => {
        if (!Array.isArray(resps) || resps.length === 0) {
        return "Agregá al menos una pregunta para crear el seguimiento.";
        }
        // si la plantilla marca requerido, exigir valor no vacío
        for (const r of resps) {
        if (r.requerido) {
            const v = r.valor;
            const empty =
            v === null ||
            v === undefined ||
            (typeof v === "string" && v.trim() === "") ||
            (Array.isArray(v) && v.length === 0);
            if (empty) {
            return `La pregunta "${r.pregunta}" es obligatoria.`;
            }
        }
        }
        return "";
    };

    const stripTransientFields = (resps) =>
        resps.map(({ _id, requerido, ...rest }) => rest);
    // -------------------------------------------------------

    const onSubmit = async (e) => {
        e.preventDefault();
        setUiError("");
        setUiOk("");

        const respuestas = buildRespuestas();
        const msg = validateRespuestas(respuestas);
        if (msg) {
        setUiError(msg);
        return;
        }

        try {
        const body = {
            paciente_id: pacienteId,
            respuestas: stripTransientFields(respuestas),
        };

        // Agregar snapshot de plantilla si se usó una
        if (modoPlantilla && plantillaSnapshot) {
            body.plantilla_usada = plantillaSeleccionada;
            body.plantilla_snapshot = plantillaSnapshot;
        }

        await dispatch(crearSeguimiento(body)).unwrap();

        // Éxito: limpiar formulario y refrescar historial
        setUiOk("Seguimiento guardado correctamente.");
        setSeleccionadas([]);
        setValores({});
        setObs({});
        setQuery("");
        setModoPlantilla(false);
        setPlantillaSeleccionada(null);
        setPlantillaSnapshot(null);
        await dispatch(fetchConsultasPaciente(pacienteId));
        } catch (err) {
        // errorStore ya se setea en slice; mostramos algo amigable
        const detail =
            err?.detail ||
            errorStore?.detail ||
            "No se pudo guardar el seguimiento.";
        setUiError(typeof detail === "string" ? detail : "Error al guardar.");
        }
    };

    if (cargando) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    const getInitials = (nombre, apellido) => {
        const n = (nombre || "")[0] || "";
        const a = (apellido || "")[0] || "";
        return (n + a).toUpperCase();
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header del Paciente - Mejorado */}
            {paciente && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start gap-4">
                        {/* Avatar con iniciales */}
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-semibold flex-shrink-0">
                            {getInitials(paciente.nombre, paciente.apellido)}
                        </div>
                        
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {paciente.nombre} {paciente.apellido}
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                    </svg>
                                    DNI: {paciente.dni}
                                </span>
                                <span>·</span>
                                <span>{paciente.edad} años</span>
                                <span>·</span>
                                <span>{paciente.genero}</span>
                                {paciente.telefono && (
                                    <>
                                        <span>·</span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {paciente.telefono}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Consulta inicial - Colapsible */}
            {consultaInicial && (
                <details className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <summary className="cursor-pointer p-4 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Consulta Inicial</h3>
                                    <p className="text-sm text-gray-600">
                                        {consultaInicial.fecha
                                            ? new Date(consultaInicial.fecha).toLocaleDateString("es-ES", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : "-"}
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm text-gray-500">
                                {consultaInicial.respuestas?.length || 0} registros
                            </span>
                        </div>
                    </summary>
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(consultaInicial.respuestas || []).map((r, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-sm font-medium text-gray-900">{r.pregunta}</div>
                                    <div className="text-base text-gray-700 mt-1">
                                        {r.valor} {r.unidad || ""}
                                    </div>
                                    {r.observacion && (
                                        <div className="text-xs text-gray-600 mt-1 italic">
                                            {r.observacion}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </details>
            )}

            {/* Historial de seguimientos - Colapsible */}
            {seguimientos.length > 0 && (
                <details className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <summary className="cursor-pointer p-4 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Historial de Seguimientos</h3>
                                    <p className="text-sm text-gray-600">Registros previos del paciente</p>
                                </div>
                            </div>
                            <span className="text-sm text-gray-500">
                                {seguimientos.length} {seguimientos.length === 1 ? 'seguimiento' : 'seguimientos'}
                            </span>
                        </div>
                    </summary>
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                        {[...seguimientos]
                            .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
                            .map((seg, idx, arr) => (
                                <div key={seg.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-900">
                                            Seguimiento #{arr.length - idx}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            {seg.fecha ? new Date(seg.fecha).toLocaleDateString("es-ES") : "-"}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {(seg.respuestas || []).map((r, i) => (
                                            <div key={i} className="text-sm text-gray-700">
                                                <span className="font-medium">{r.pregunta}:</span> {r.valor} {r.unidad || ""}
                                                {r.observacion && (
                                                    <span className="text-gray-600 italic"> ({r.observacion})</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </details>
            )}

            {/* Alerta si no tiene consulta inicial */}
            {!consultaInicial && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                                <span className="font-medium">Información:</span> Este paciente aún no tiene una consulta inicial registrada. 
                                Puedes crear un seguimiento usando una plantilla o preguntas personalizadas.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulario de nuevo seguimiento - Mejorado */}
            <form onSubmit={onSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Nuevo Seguimiento</h2>
                    <p className="text-sm text-gray-600 mt-1">Registra la información del seguimiento del paciente</p>
                </div>

                {/* Mensajes */}
                {uiError && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{uiError}</p>
                            </div>
                        </div>
                    </div>
                )}
                {uiOk && (
                    <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-800">{uiOk}</p>
                            </div>
                        </div>
                    </div>
                )}

            {/* Selector de Plantillas - Mejorado */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <input
                        type="checkbox"
                        id="usarPlantilla"
                        checked={modoPlantilla}
                        onChange={(e) => {
                            setModoPlantilla(e.target.checked);
                            if (!e.target.checked) {
                                setPlantillaSeleccionada(null);
                                setPlantillaSnapshot(null);
                                setSeleccionadas([]);
                                setValores({});
                                setObs({});
                            }
                        }}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <label htmlFor="usarPlantilla" className="text-base font-semibold text-gray-900 cursor-pointer">
                        📋 Usar Plantilla de Seguimiento
                    </label>
                </div>

                {modoPlantilla && (
                    <div className="space-y-4 pl-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seleccionar Plantilla
                            </label>
                            <select
                                value={plantillaSeleccionada || ''}
                                onChange={handlePlantillaChange}
                                className="w-full border-2 border-indigo-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={loadingPlantillas}
                            >
                                <option value="">-- Selecciona una plantilla --</option>
                                {plantillas?.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {plantillaSeleccionada && plantillaSnapshot && (
                            <div className="bg-white rounded-lg border border-indigo-200 p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{plantillaSnapshot.nombre}</p>
                                        {plantillaSnapshot.descripcion && (
                                            <p className="text-sm text-gray-600 mt-1">{plantillaSnapshot.descripcion}</p>
                                        )}
                                        <p className="text-xs text-indigo-600 mt-2 font-medium">
                                            ✓ {plantillaSnapshot.preguntas?.length || 0} preguntas configuradas
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selección Manual de Preguntas (solo si no está en modo plantilla) */}
            {!modoPlantilla && (
                <>
                    {/* Buscador por preguntas */}
                    <Combobox value={null} onChange={agregarPregunta}>
                        <div className="relative">
                        <Combobox.Input
                            className="w-full border rounded p-2"
                            placeholder="Buscar pregunta…"
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {preguntasFiltradas.length > 0 && (
                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border shadow-lg">
                            {preguntasFiltradas.map((q) => (
                                <Combobox.Option
                                key={q.id}
                                value={q}
                                className="cursor-pointer select-none p-2 hover:bg-indigo-600 hover:text-white"
                                >
                                {q.texto}
                                </Combobox.Option>
                            ))}
                            </Combobox.Options>
                        )}
                        </div>
                    </Combobox>

                    {/* Crear y guardar en banco + agregar al seguimiento */}
                    <PersonalizadaBuilder
                    onSave={async (payload) => {
                        // 1) guardar en banco
                        const creada = await dispatch(crearPreguntaPersonalizada(payload)).unwrap();
                        // 2) agregar a seleccionadas para este seguimiento
                        setSeleccionadas((prev) => [...prev, creada]);
                        return creada;
                    }}
                    />
                </>
            )}


            {/* Preguntas seleccionadas - Mejorado */}
            {seleccionadas.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <h3 className="text-base font-semibold text-gray-900">
                            Preguntas del Seguimiento
                        </h3>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                            {seleccionadas.length} {seleccionadas.length !== 1 ? 'preguntas' : 'pregunta'}
                        </span>
                    </div>
                    
                    {seleccionadas.map((q) => (
                        <div key={q.id} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 relative hover:border-indigo-300 transition-colors">
                            {/* Botón quitar */}
                            <button
                                type="button"
                                onClick={() => setSeleccionadas((prev) => prev.filter((p) => p.id !== q.id))}
                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                aria-label="Quitar pregunta"
                                title="Quitar pregunta"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <label className="block text-base font-semibold text-gray-900 mb-3 pr-10">
                                {q.texto}
                                {q.requerido && <span className="text-red-600 ml-1">*</span>}
                            </label>

                            {/* Valor según tipo */}
                            <div className="mt-2">
                                <InputByType
                                    q={q}
                                    value={valores[q.id]}
                                    onChange={(v) => setVal(q.id, v)}
                                />
                            </div>

                            {/* Observación transversal */}
                            <ObservationField
                                value={obs[q.id] || ""}
                                onChange={(txt) => setObFn(q.id, txt)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Botón de envío - Mejorado */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={creating === "loading"}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {creating === "loading" ? (
                        <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando…
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Guardar Seguimiento
                        </>
                    )}
                </button>
            </div>
        </form>
        </div>
    );
}
