import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Combobox } from "@headlessui/react";
import { fetchPreguntasPersonalizadas, crearPreguntaPersonalizada } from "../../../features/preguntas/preguntasSlice.js";
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


    // UI local
    const [valores, setValores] = useState({});
    const [obs, setObs] = useState({});
    const [seleccionadas, setSeleccionadas] = useState([]);
    const [query, setQuery] = useState("");
    const [nuevaPregunta, setNuevaPregunta] = useState("");

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
        await dispatch(crearSeguimiento(body)).unwrap();

        // Éxito: limpiar formulario y refrescar historial
        setUiOk("Seguimiento guardado correctamente.");
        setSeleccionadas([]);
        setValores({});
        setObs({});
        setQuery("");
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
        return <p className="text-gray-500">Cargando historial…</p>;
    }

    return (
        <div className="space-y-6">
        {/* Datos del paciente */}
        {paciente && (
            <div className="border p-4 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold">
                {paciente.nombre} {paciente.apellido}
            </h2>
            <p className="text-sm text-gray-600">
                DNI: {paciente.dni} · Edad: {paciente.edad} · Género: {paciente.genero}
            </p>
            <p className="text-sm text-gray-600">Tel: {paciente.telefono}</p>
            </div>
        )}

        {/* Consulta inicial */}
        {consultaInicial && (
            <div className="border p-4 rounded bg-gray-50">
            <h3 className="font-medium mb-2">
                Consulta Inicial —{" "}
                {consultaInicial.fecha
                ? new Date(consultaInicial.fecha).toLocaleDateString()
                : "-"}
            </h3>
            <ul className="list-disc ml-5 space-y-1">
                {(consultaInicial.respuestas || []).map((r, idx) => (
                <li key={idx}>
                    <b>{r.pregunta}</b>: {r.valor} {r.unidad || ""}
                    {r.observacion && <i> ({r.observacion})</i>}
                </li>
                ))}
            </ul>
            </div>
        )}

{/* Historial de seguimientos */}
{seguimientos.length > 0 && (
    <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">Historial de Seguimientos</h3>

        {[...seguimientos]
        .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)) // más reciente primero
        .map((seg, idx, arr) => (
            <div key={seg.id} className="mb-3">
            {/* Visible: número ordinal y fecha. Oculto: ID interno como tooltip */}
            <p
                className="text-sm text-gray-700"
                title={`ID interno: ${seg.id}`}  // <-- queda solo como ayuda
            >
                Seguimiento #{arr.length - idx} —{" "}
                {seg.fecha ? new Date(seg.fecha).toLocaleDateString() : "-"}
            </p>

            <ul className="list-disc ml-5">
                {(seg.respuestas || []).map((r, i) => (
                <li key={i}>
                    {r.pregunta}: {r.valor} {r.unidad || ""}
                    {r.observacion ? <i> ({r.observacion})</i> : null}
                </li>
                ))}
            </ul>
            </div>
        ))}
    </div>
)}


        {/* Formulario de nuevo seguimiento */}
        {consultaInicial && (
            <form onSubmit={onSubmit} className="space-y-4">
            <h3 className="font-medium">Nuevo seguimiento</h3>

            {/* Mensajes */}
            {uiError && (
                <div className="rounded border border-red-300 bg-red-50 text-red-800 p-2 text-sm">
                {uiError}
                </div>
            )}
            {uiOk && (
                <div className="rounded border border-green-300 bg-green-50 text-green-800 p-2 text-sm">
                {uiOk}
                </div>
            )}

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


            {/* Preguntas seleccionadas */}
            {seleccionadas.map((q) => (
                <div key={q.id} className="border p-3 rounded relative bg-white">
                {/* Quitar */}
                <button
                    type="button"
                    onClick={() =>
                    setSeleccionadas((prev) => prev.filter((p) => p.id !== q.id))
                    }
                    className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                    aria-label="Quitar pregunta"
                    title="Quitar pregunta"
                >
                    ✕
                </button>

                <label className="block font-medium">
                    {q.texto} {q.requerido ? <span className="text-red-600">*</span> : null}
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

            <button
                type="submit"
                className="px-4 py-2 rounded text-white"
                disabled={creating === "loading"}
                style={{
                backgroundColor: creating === "loading" ? "#7C3AED80" : "#7C3AED",
                cursor: creating === "loading" ? "not-allowed" : "pointer",
                }}
            >
                {creating === "loading" ? "Guardando…" : "Guardar seguimiento"}
            </button>
            </form>
        )}
        </div>
    );
}
