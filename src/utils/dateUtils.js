/**
 * Convierte una fecha en formato ISO (YYYY-MM-DD) a un objeto Date local
 * sin conversión a UTC para evitar problemas de zona horaria
 *
 * @param {string} dateString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {Date} Objeto Date en zona horaria local
 */
export const parseLocalDate = (dateString) => {
    if (!dateString) return null;

    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
};

/**
 * Formatea una fecha ISO a formato local (dd/mm/yyyy)
 *
 * @param {string} dateString - Fecha en formato ISO (YYYY-MM-DD)
 * @param {string} locale - Locale para el formato (default: 'es-ES')
 * @returns {string} Fecha formateada
 */
export const formatLocalDate = (dateString, locale = 'es-ES') => {
    const date = parseLocalDate(dateString);
    return date ? date.toLocaleDateString(locale) : '';
};

/**
 * Convierte un objeto Date a formato ISO (YYYY-MM-DD) sin conversión a UTC
 *
 * @param {Date} date - Objeto Date
 * @returns {string} Fecha en formato ISO (YYYY-MM-DD)
 */
export const toISODateString = (date) => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
