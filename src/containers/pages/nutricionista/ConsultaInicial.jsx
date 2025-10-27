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
        if (!plantilla || !plantilla.preguntas_config) return;

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
        if (valor === "") {
            setPlantillaSeleccionada(null);
            setPlantillaSnapshot(null);
            // Resetear selección y valores si cambia de plantilla
            setSeleccion({});
            setValores({});
            setObs({});
        } else {
            setPlantillaSeleccionada(parseInt(valor));
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
        <div className="space-y-6">
        <h2 className="text-xl font-semibold">Consulta Inicial</h2>

        {/* Selector de Plantilla */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800">Usar Plantilla</h3>
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
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Activar</span>
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
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>📋 {plantillaSnapshot.nombre}</strong>
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                {plantillaSnapshot.preguntas.length} preguntas configuradas
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {pqStatus === "loading" && <p className="text-gray-500">Cargando preguntas…</p>}
        {pqStatus === "failed" && (
            <p className="text-red-600">Error al cargar preguntas</p>
        )}

        {pqStatus === "succeeded" && (
            <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl"
            >
            {/* Datos del paciente */}
            <PacienteForm pac={pac} onChange={onPac} fieldError={fieldError} />

            {/* Preguntas dinámicas */}
            <PreguntasForm
                preguntas={preguntasAMostrar}
                seleccion={seleccion}
                valores={valores}
                obs={obs}
                toggleSel={toggleSel}
                setVal={setVal}
                setOb={setOb}
            />

            {/* IMC preview (solo si existen peso/altura) */}
            {imcPreview && (
                <div className="md:col-span-2 text-sm">
                IMC estimado: <b>{imcPreview}</b>
                </div>
            )}

            {/* Botón */}
            <div className="md:col-span-2">
                <button
                type="submit"
                disabled={creating === "loading"}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                {creating === "loading"
                    ? "Guardando…"
                    : "Guardar consulta inicial"}
                </button>
            </div>
            </form>
        )}

        {/* Errores */}
        {creating === "failed" &&
            (typeof error === "string" ? (
            <p className="text-red-600">{error}</p>
            ) : (
            error?.detail && <p className="text-red-600">{error.detail}</p>
            ))}

        {/* Mensaje de éxito */}
        {lastCreated && (
            <div className="rounded border p-4 bg-green-50 text-green-800 space-y-1">
            <div>
                Consulta creada — ID: <b>{lastCreated.consulta_id}</b>
            </div>
            <div>
                Paciente ID: <b>{lastCreated.paciente_id}</b>
            </div>
            {lastCreated.nuevo_paciente && lastCreated.password_inicial && (
                <div>
                Contraseña inicial generada:{" "}
                <b>{lastCreated.password_inicial}</b>
                </div>
            )}
            {lastCreated.imc && (
                <div>
                IMC calculado: <b>{lastCreated.imc}</b>
                </div>
            )}
            <button
                className="mt-2 text-sm underline"
                onClick={() => dispatch(clearLastCreated())}
            >
                Ocultar
            </button>
            </div>
        )}
        </div>
    );
}
