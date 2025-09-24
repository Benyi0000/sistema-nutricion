import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../../lib/api';

function AppointmentCalendar({ onDateSelect, onTimeSelect, onClose }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availableTimes, setAvailableTimes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para cargar horarios disponibles
    const loadAvailableTimes = async (date) => {
        if (!date) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const dateStr = date.toISOString().split('T')[0];
            const response = await appointmentsAPI.getAvailableTimes({ date: dateStr });
            setAvailableTimes(response.data.time_slots || []);
        } catch (err) {
            console.error('Error loading available times:', err);
            setError('Error al cargar horarios disponibles');
            setAvailableTimes([]);
        } finally {
            setLoading(false);
        }
    };

    // Generar días del mes actual
    const generateDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        
        // Días del mes anterior (para completar la semana)
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const prevMonth = new Date(year, month - 1, lastDay.getDate() - i);
            days.push({
                date: prevMonth.getDate(),
                fullDate: prevMonth,
                isCurrentMonth: false,
                isAvailable: false
            });
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const fullDate = new Date(year, month, day);
            const dayOfWeek = fullDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo o Sábado
            
            days.push({
                date: day,
                fullDate: fullDate,
                isCurrentMonth: true,
                isAvailable: !isWeekend && fullDate >= new Date() // Disponible si no es fin de semana y no es pasado
            });
        }

        // Completar con días del siguiente mes
        const remainingDays = 42 - days.length; // 6 semanas * 7 días
        for (let day = 1; day <= remainingDays; day++) {
            const nextMonth = new Date(year, month + 1, day);
            days.push({
                date: day,
                fullDate: nextMonth,
                isCurrentMonth: false,
                isAvailable: false
            });
        }

        return days;
    };

    const days = generateDays();
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];


    const handleDateClick = async (day) => {
        if (day.isAvailable) {
            setSelectedDate(day.fullDate);
            setSelectedTime(null);
            onDateSelect(day.fullDate);
            await loadAvailableTimes(day.fullDate);
        }
    };

    const handleTimeClick = (time) => {
        setSelectedTime(time);
        onTimeSelect(time);
    };

    const handleConfirm = async () => {
        if (selectedDate && selectedTime) {
            setLoading(true);
            setError(null);
            
            try {
                const appointmentData = {
                    appointment_date: selectedDate.toISOString().split('T')[0],
                    appointment_time: selectedTime,
                    consultation_type: 'seguimiento',
                    notes: '',
                    duration_minutes: 60
                };
                
                console.log('Sending appointment data:', appointmentData);
                await appointmentsAPI.create(appointmentData);
                alert(`Cita agendada para el ${selectedDate.toLocaleDateString('es-ES')} a las ${selectedTime}`);
                onClose();
            } catch (err) {
                console.error('Error creating appointment:', err);
                console.error('Error response:', err.response?.data);
                const errorMessage = err.response?.data?.error || 
                                   err.response?.data?.detail || 
                                   err.response?.data?.non_field_errors?.[0] ||
                                   'Error al agendar la cita';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Agendar Turno</h2>
                                <p className="text-blue-100">Selecciona la fecha y hora para tu consulta</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Calendario */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Selecciona una fecha
                            </h3>
                            
                            {/* Navegación del mes */}
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h4 className="text-xl font-semibold text-gray-900">
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </h4>
                                <button
                                    onClick={nextMonth}
                                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Días de la semana */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {dayNames.map(day => (
                                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Días del calendario */}
                            <div className="grid grid-cols-7 gap-1">
                                {days.map((day, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleDateClick(day)}
                                        disabled={!day.isAvailable}
                                        className={`
                                            p-2 text-sm rounded-md transition-colors
                                            ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                                            ${!day.isAvailable ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}
                                            ${selectedDate && day.fullDate.getTime() === selectedDate.getTime() ? 'bg-purple-600 text-white' : ''}
                                            ${day.isAvailable && day.isCurrentMonth ? 'hover:bg-purple-50' : ''}
                                        `}
                                    >
                                        {day.date}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Horarios */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Selecciona un horario
                            </h3>
                            
                            {selectedDate ? (
                                <div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Horarios disponibles para el {selectedDate.toLocaleDateString('es-ES')}
                                    </p>
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                                            <p className="text-gray-500 mt-2">Cargando horarios...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-8">
                                            <p className="text-red-500">{error}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableTimes.map((timeSlot, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleTimeClick(timeSlot.time)}
                                                    disabled={!timeSlot.is_available}
                                                    className={`
                                                        p-3 text-sm rounded-md border transition-colors
                                                        ${selectedTime === timeSlot.time 
                                                            ? 'bg-purple-600 text-white border-purple-600' 
                                                            : timeSlot.is_available
                                                                ? 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        }
                                                    `}
                                                >
                                                    {timeSlot.time}
                                                    {!timeSlot.is_available && (
                                                        <span className="block text-xs">Ocupado</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-gray-500">Selecciona una fecha para ver los horarios disponibles</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedDate || !selectedTime || loading}
                            className={`
                                px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 transform
                                ${selectedDate && selectedTime && !loading
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }
                            `}
                        >
                            {loading ? 'Agendando...' : 'Confirmar Cita'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppointmentCalendar;
