import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { fetchPreguntas } from "../../../features/preguntas/preguntasSlice";
import { crearConsultaInicial, clearLastCreated } from "../../../features/consultas/consultasSlice";
import { useGetPlantillasQuery } from "../../../features/plantillas/plantillasSlice";

import PacienteForm from "../../../components/consultas/PacienteForm";
import PreguntasForm from "../../../components/consultas/PreguntasForm";

export default function ConsultaInicial() {
    const dispatch = useDispatch();
    const preguntasRaw = useSelector((s) => s.preguntas.byScope.inicial);
    const pqStatus = useSelector((s) => s.preguntas.status);
    const { creating, error, lastCreated } = useSelector((s) => s.consultas);

    // Cargar plantillas disponibles
    const { data: plantillas, isLoading: loadingPlantillas } = useGetPlantillasQuery({
        tipo_consulta: 'INICIAL',
        activo: true,
    });

    // Estados
    const [modoPlantilla, setModoPlantilla] = useState(true); // true = usar plantilla, false = manual
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
    const [plantillaSnapshot, setPlantillaSnapshot] = useState(null);

    // Normalizar: array plano o {results:[]}
    const preguntas = Array.isArray(preguntasRaw)
        ? preguntasRaw
        : preguntasRaw?.results || [];

    // Estado paciente
    const [pac, setPac] = useState({
        dni: "",
        email: "",
        first_name: "",
        last_name: "",
        telefono: "",
        fecha_nacimiento: "",
        genero: "M",
        // ⚠️ no pedimos password, se genera automáticamente en backend
    });

    // Estado dinámico de preguntas
    const [seleccion, setSeleccion] = useState({});
    const [valores, setValores] = useState({});
    const [obs, setObs] = useState({});

    // Cargar preguntas iniciales
    useEffect(() => {
        if (!modoPlantilla) {
            // Modo manual: cargar todas las preguntas
            dispatch(fetchPreguntas({ scope: "inicial" }));
        }
    }, [dispatch, modoPlantilla]);

    // Cargar preguntas al montar (incluso en modo plantilla para tener disponibles)
    useEffect(() => {
        dispatch(fetchPreguntas({ scope: "inicial" }));
    }, [dispatch]);

    // Auto-seleccionar plantilla predeterminada al cargar
    useEffect(() => {
        if (modoPlantilla && plantillas && plantillas.length > 0 && !plantillaSeleccionada) {
            // Buscar plantilla predeterminada
            const predeterminada = plantillas.find(p => p.es_predeterminada);
            if (predeterminada) {
                setPlantillaSeleccionada(predeterminada.id);
            }
        }
    }, [modoPlantilla, plantillas, plantillaSeleccionada]);

    // Cargar preguntas de la plantilla seleccionada
    useEffect(() => {
        if (!modoPlantilla || !plantillaSeleccionada || !plantillas) return;

        const plantilla = plantillas.find(p => p.id === parseInt(plantillaSeleccionada));
        
        if (!plantilla || !plantilla.preguntas_config) {
            return;
        }

        // Generar snapshot de la plantilla
        const snapshot = {
            plantilla_id: plantilla.id,
            nombre: plantilla.nombre,
            tipo_consulta: plantilla.tipo_consulta,
            config: plantilla.config,
            preguntas: plantilla.preguntas_config.map(pc => ({
                orden: pc.orden,
                visible: pc.visible,
                requerido: pc.requerido_en_plantilla,
                config: pc.config,
                pregunta: {
                    id: pc.pregunta.id,
                    texto: pc.pregunta.texto,
                    tipo: pc.pregunta.tipo,
                    codigo: pc.pregunta.codigo,
                    unidad: pc.pregunta.unidad,
                    opciones: pc.pregunta.opciones,
                    requerido_base: pc.pregunta.requerido,
                }
            })),
            snapshot_date: new Date().toISOString(),
        };
        
        setPlantillaSnapshot(snapshot);

        // Auto-seleccionar preguntas según la plantilla
        const sel = {};
        plantilla.preguntas_config.forEach((pc) => {
            if (pc.visible) {
                sel[pc.pregunta.id] = true;
            }
        });
        setSeleccion(sel);

    }, [modoPlantilla, plantillaSeleccionada, plantillas]);

    // Obtener lista de preguntas a mostrar
    const preguntasAMostrar = useMemo(() => {
        if (modoPlantilla && plantillaSnapshot) {
            // Modo plantilla: usar preguntas de la plantilla ordenadas
            return plantillaSnapshot.preguntas
                .filter(pc => pc.visible)
                .sort((a, b) => a.orden - b.orden)
                .map(pc => pc.pregunta);
        } else {
            // Modo manual: usar todas las preguntas iniciales
            return preguntas;
        }
    }, [modoPlantilla, plantillaSnapshot, preguntas]);

    // Preseleccionar requeridas (solo en modo manual)
    useEffect(() => {
        if (modoPlantilla || pqStatus !== "succeeded" || !Array.isArray(preguntas)) return;
        const sel = {};
        preguntas.forEach((q) => {
            if (q.requerido) sel[q.id] = true;
            if (q.codigo === "peso_kg" || q.codigo === "altura_cm") sel[q.id] = true;
        });
        setSeleccion(sel);
    }, [modoPlantilla, pqStatus, preguntas]);

    // Preview IMC si existen peso y altura
    const imcPreview = useMemo(() => {
        const preguntasData = modoPlantilla && plantillaSnapshot 
            ? plantillaSnapshot.preguntas.map(pc => pc.pregunta)
            : preguntas;
        
        if (!Array.isArray(preguntasData)) return null;
        const qPeso = preguntasData.find((q) => q.codigo === "peso_kg");
        const qAlt = preguntasData.find((q) => q.codigo === "altura_cm");
        if (!qPeso || !qAlt) return null;
        const p = parseFloat(valores[qPeso.id] ?? "");
        const a = parseFloat(valores[qAlt.id] ?? "");
        if (!p || !a) return null;
        const m = a / 100.0;
        return (p / (m * m)).toFixed(2);
    }, [valores, preguntas, modoPlantilla, plantillaSnapshot]);

    // Helpers
    const onPac = (e) => setPac({ ...pac, [e.target.name]: e.target.value });
    const toggleSel = (id) =>
        setSeleccion({ ...seleccion, [id]: !seleccion[id] });
    const setVal = (id, v) => setValores({ ...valores, [id]: v });
    const setOb = (id, v) => setObs({ ...obs, [id]: v });

    // Handler para cambio de plantilla
    const handlePlantillaChange = (e) => {
        const valor = e.target.value;
        
        // Siempre resetear estado cuando cambia la plantilla
        setSeleccion({});
        setValores({});
        setObs({});
        
        if (valor === "") {
            setPlantillaSeleccionada(null);
            setPlantillaSnapshot(null);
        } else {
            setPlantillaSeleccionada(parseInt(valor));
            // El snapshot se generará automáticamente en el useEffect
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        // Usar preguntasAMostrar en lugar de preguntas directamente
        const preguntasData = preguntasAMostrar || [];
        
        const respuestas = preguntasData
            .filter((q) => seleccion[q.id])
            .map((q) => ({
                pregunta: q.texto,
                tipo: q.tipo,
                codigo: q.codigo || null,
                unidad: q.unidad || null,
                valor: valores[q.id] ?? null,
                observacion: (obs[q.id] && obs[q.id].trim()) ? obs[q.id].trim() : null,
            }));

        const payload = {
            ...pac,
            respuestas,
            notas: "",
            // Si se usó plantilla, enviar el ID y el snapshot ya generado
            plantilla_usada: modoPlantilla && plantillaSeleccionada ? plantillaSeleccionada : null,
            plantilla_snapshot: modoPlantilla && plantillaSnapshot ? plantillaSnapshot : {
                preguntas: preguntasData.map((q) => ({
                    id: q.id,
                    texto: q.texto,
                    tipo: q.tipo,
                    codigo: q.codigo,
                    requerido: q.requerido,
                    unidad: q.unidad,
                    seleccionada: !!seleccion[q.id],
                })),
            },
        };

        await dispatch(crearConsultaInicial(payload));
    };

    const fieldError = (name) =>
        error && typeof error === "object" && error[name]
        ? Array.isArray(error[name])
            ? error[name].join(", ")
            : String(error[name])
        : null;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Consulta Inicial</h1>
                <p className="text-sm text-gray-600">
                    Registra un nuevo paciente y crea su primera consulta
                </p>
            </div>

            {/* Mostrar loading solo si está en modo manual y cargando */}
            {!modoPlantilla && pqStatus === "loading" && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-500 mt-3 text-sm">Cargando preguntas…</p>
                </div>
            )}
            
            {pqStatus === "failed" && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                    <p className="text-red-800 text-sm">Error al cargar preguntas</p>
                </div>
            )}

            {/* Mostrar formulario si está en modo plantilla O si las preguntas están cargadas */}
            {(modoPlantilla || pqStatus === "succeeded") && (
                <form onSubmit={onSubmit} className="space-y-6 max-w-6xl">
                    {/* ============================================ */}
                    {/* SECCIÓN 1: DATOS PERSONALES DEL PACIENTE */}
                    {/* ============================================ */}
                    <div className="bg-white rounded border border-gray-200 p-5">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            Datos Personales del Paciente
                        </h2>
                        <PacienteForm pac={pac} onChange={onPac} fieldError={fieldError} />
                    </div>

                    {/* ============================================ */}
                    {/* SECCIÓN 2: PLANTILLA Y PREGUNTAS DE SALUD */}
                    {/* ============================================ */}
                    <div className="bg-white rounded border border-gray-200 p-5">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            Datos de Salud y Seguimiento
                        </h2>

                        {/* Selector de Plantilla */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Usar Plantilla
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={modoPlantilla}
                                        onChange={(e) => {
                                            setModoPlantilla(e.target.checked);
                                            if (!e.target.checked) {
                                                setPlantillaSeleccionada(null);
                                                setPlantillaSnapshot(null);
                                            }
                                        }}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Activar</span>
                                </label>
                            </div>

                            {modoPlantilla && (
                                <div>
                                    {loadingPlantillas ? (
                                        <p className="text-sm text-gray-500">Cargando plantillas...</p>
                                    ) : (
                                        <select
                                            value={plantillaSeleccionada || ''}
                                            onChange={handlePlantillaChange}
                                            className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                        >
                                            <option value="">-- Seleccionar plantilla --</option>
                                            
                                            {/* Plantillas del sistema */}
                                            {plantillas?.filter(p => p.owner_info?.tipo === 'sistema').length > 0 && (
                                                <optgroup label="Plantillas del Sistema">
                                                    {plantillas
                                                        .filter(p => p.owner_info?.tipo === 'sistema')
                                                        .map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.nombre} {p.es_predeterminada ? '⭐' : ''}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                            )}
                                            
                                            {/* Plantillas del nutricionista */}
                                            {plantillas?.filter(p => p.owner_info?.tipo === 'nutricionista').length > 0 && (
                                                <optgroup label="Mis Plantillas">
                                                    {plantillas
                                                        .filter(p => p.owner_info?.tipo === 'nutricionista')
                                                        .map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.nombre} {p.es_predeterminada ? '⭐' : ''}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                            )}
                                        </select>
                                    )}

                                    {/* Info de plantilla seleccionada */}
                                    {plantillaSeleccionada && plantillaSnapshot && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">
                                                📋 {plantillaSnapshot.nombre}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {plantillaSnapshot.preguntas.filter(p => p.visible).length} preguntas • {plantillaSnapshot.tipo_consulta}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Preguntas dinámicas */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                                Preguntas de la Consulta
                            </h3>
                            <PreguntasForm
                                preguntas={preguntasAMostrar}
                                seleccion={seleccion}
                                valores={valores}
                                obs={obs}
                                toggleSel={toggleSel}
                                setVal={setVal}
                                setOb={setOb}
                            />
                        </div>

                        {/* IMC preview */}
                        {imcPreview && (
                            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-indigo-900 mr-2">IMC Estimado:</span>
                                    <span className="text-xl font-bold text-indigo-700">{imcPreview}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ============================================ */}
                    {/* BOTONES DE ACCIÓN */}
                    {/* ============================================ */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                setPac({
                                    dni: "",
                                    email: "",
                                    first_name: "",
                                    last_name: "",
                                    telefono: "",
                                    fecha_nacimiento: "",
                                    genero: "M",
                                });
                                setSeleccion({});
                                setValores({});
                                setObs({});
                            }}
                            className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Limpiar
                        </button>
                        <button
                            type="submit"
                            disabled={creating === "loading"}
                            className="px-6 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating === "loading" ? "Guardando..." : "Guardar Consulta"}
                        </button>
                    </div>
                </form>
            )}

            {/* ============================================ */}
            {/* MENSAJES DE ERROR */}
            {/* ============================================ */}
            {creating === "failed" && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
                    <div className="flex">
                        <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error al guardar</h3>
                            <p className="text-sm text-red-700 mt-1">
                                {typeof error === "string" ? error : error?.detail || "Error desconocido"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================ */}
            {/* MENSAJE DE ÉXITO */}
            {/* ============================================ */}
            {lastCreated && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-green-900 mb-2">
                                Consulta Inicial Creada Exitosamente
                            </h3>
                            <dl className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded border border-green-200">
                                    <dt className="text-gray-600">ID Consulta:</dt>
                                    <dd className="font-semibold text-green-700">#{lastCreated.consulta_id}</dd>
                                </div>
                                <div className="bg-white p-2 rounded border border-green-200">
                                    <dt className="text-gray-600">ID Paciente:</dt>
                                    <dd className="font-semibold text-green-700">#{lastCreated.paciente_id}</dd>
                                </div>
                                {lastCreated.imc && (
                                    <div className="bg-white p-2 rounded border border-green-200">
                                        <dt className="text-gray-600">IMC:</dt>
                                        <dd className="font-semibold text-green-700">{lastCreated.imc}</dd>
                                    </div>
                                )}
                                {lastCreated.nuevo_paciente && lastCreated.password_inicial && (
                                    <div className="bg-yellow-50 p-2 rounded border border-yellow-300 col-span-2">
                                        <dt className="text-yellow-800 font-medium mb-1">Contraseña Temporal:</dt>
                                        <dd className="font-mono font-bold text-yellow-900 text-sm">
                                            {lastCreated.password_inicial}
                                        </dd>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            ⚠️ El paciente debe cambiarla en su primer inicio de sesión
                                        </p>
                                    </div>
                                )}
                            </dl>
                            <button
                                className="mt-3 text-xs text-green-700 hover:text-green-800 underline"
                                onClick={() => dispatch(clearLastCreated())}
                            >
                                Cerrar mensaje
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
