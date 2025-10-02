import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { fetchPreguntas } from "../../../features/preguntas/preguntasSlice";
import { crearConsultaInicial, clearLastCreated } from "../../../features/consultas/consultasSlice";

import PacienteForm from "../../../components/consultas/PacienteForm";
import PreguntasForm from "../../../components/consultas/PreguntasForm";

export default function ConsultaInicial() {
    const dispatch = useDispatch();
    const preguntasRaw = useSelector((s) => s.preguntas.byScope.inicial);
    const pqStatus = useSelector((s) => s.preguntas.status);
    const { creating, error, lastCreated } = useSelector((s) => s.consultas);

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
        dispatch(fetchPreguntas({ scope: "inicial" }));
    }, [dispatch]);

    // Preseleccionar requeridas
    useEffect(() => {
        if (pqStatus !== "succeeded" || !Array.isArray(preguntas)) return;
        const sel = {};
        preguntas.forEach((q) => {
        if (q.requerido) sel[q.id] = true;
        if (q.codigo === "peso_kg" || q.codigo === "altura_cm") sel[q.id] = true;
        });
        setSeleccion(sel);
    }, [pqStatus, preguntas]);

    // Preview IMC si existen peso y altura
    const imcPreview = useMemo(() => {
        if (!Array.isArray(preguntas)) return null;
        const qPeso = preguntas.find((q) => q.codigo === "peso_kg");
        const qAlt = preguntas.find((q) => q.codigo === "altura_cm");
        if (!qPeso || !qAlt) return null;
        const p = parseFloat(valores[qPeso.id] ?? "");
        const a = parseFloat(valores[qAlt.id] ?? "");
        if (!p || !a) return null;
        const m = a / 100.0;
        return (p / (m * m)).toFixed(2);
    }, [valores, preguntas]);

    // Helpers
    const onPac = (e) => setPac({ ...pac, [e.target.name]: e.target.value });
    const toggleSel = (id) =>
        setSeleccion({ ...seleccion, [id]: !seleccion[id] });
    const setVal = (id, v) => setValores({ ...valores, [id]: v });
    const setOb = (id, v) => setObs({ ...obs, [id]: v });

    const onSubmit = async (e) => {
        e.preventDefault();
        const respuestas = (preguntas || [])
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
        plantilla_snapshot: {
            preguntas: (preguntas || []).map((q) => ({
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
                preguntas={preguntas}
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
