const Report = require('../models/report');

/**
 * Verifica si un reporte existe en la base de datos según su identificador (id).
 * @param {string} id Identificador del reporte a comprobar.
 */
const existReportById = async (id) => {
    // Verificar si existe en la BD.
    const exist = await Report.findById(id);
    if (!exist) {
        throw new Error(`El reporte no existe: ${id}`);
    }
};

module.exports = {
    existReportById,
};

