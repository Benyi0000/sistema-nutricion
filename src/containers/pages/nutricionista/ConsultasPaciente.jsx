import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchConsultasPaciente } from '../../../features/consultas/consultasSlice';

export default function ConsultasPaciente({ pacienteId }) {
    const dispatch = useDispatch();
    const data = useSelector(s => s.consultas.porPaciente[pacienteId] || []);

    useEffect(()=>{ dispatch(fetchConsultasPaciente({ paciente_id: pacienteId })); }, [pacienteId]);

    return (
        <div className="space-y-3">
        <h3 className="font-semibold">Consultas del paciente #{pacienteId}</h3>
        <ul className="space-y-2">
            {data.map(c => (
            <li key={c.id} className="border rounded p-3">
                <div className="text-sm text-gray-600">{new Date(c.fecha).toLocaleString()} — {c.tipo}</div>
                {c.metricas?.imc && <div className="text-sm">IMC: <b>{c.metricas.imc}</b></div>}
                {c.notas && <div className="text-sm text-gray-700 mt-1">{c.notas}</div>}
            </li>
            ))}
        </ul>
        </div>
    );
}
