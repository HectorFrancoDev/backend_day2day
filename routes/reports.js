const { Router } = require('express');
const { check } = require('express-validator');
const { createReport, getAllActivitiesFromUser, getAllReports, updateReportById, deleteReportById, deleteMassiveReports,
    clearDeletedReports, getAllReportsDashboard, createAusentimos, createReportCelula, deleteReportCelulaById, updateReportCelulaById, setHolidays, setHolidaysOtrosPaises, getAllReportsHoursGeneralActivities, deleteHolidaysTemp, setHolidaysNewColombia } = require('../controllers/reports');
const { existReportById } = require('../helpers/db-validators');
const { validateJWT, validateFields } = require('../middlewares');

const router = Router();

/**
 * Crear un nuevo registro en el time report del usuario logueado.
 * {{ url }}/api/reports
 */
router.post('/', [
    validateJWT,
    check('date', 'La fecha es obligatoria').not().isEmpty(),
    check('activity', 'La actividad es obligatoria').not().isEmpty(),
    check('detail', 'El detalle es obligatorio').not().isEmpty(),
    check('hours', 'Las horas son obligatorias').not().isEmpty().isFloat({ min: 0.1, max: 24 }),
    validateFields
], createReport);


router.post('/celulas', [
    validateJWT,
    check('date', 'La fecha es obligatoria').not().isEmpty(),
    check('activity', 'La actividad es obligatoria').not().isEmpty(),
    check('detail', 'El detalle es obligatorio').not().isEmpty(),
    check('hours', 'Las horas son obligatorias').not().isEmpty().isFloat({ min: 0.1, max: 24 }),
    validateFields
], createReportCelula);


/**
 * Obtener todos los registros del time report del usuario logueado.
 * {{ url }}/api/reports
 */
router.get('/', [
    validateJWT
], getAllReports);

router.get('/dashboard', [
    // validateJWT
], getAllReportsDashboard);


router.get('/generales', getAllReportsHoursGeneralActivities)

/**
 * Actualizar registro del time report del usuario logueado.
 * {{ url }}/api/reports/:id
 */
router.put('/:id', [
    validateJWT,
    check('date', 'La fecha es obligatoria').not().isEmpty(),
    check('activity', 'La actividad es obligatoria').not().isEmpty(),
    check('detail', 'El detalle es obligatorio').not().isEmpty(),
    check('hours', 'Las horas son obligatorias').not().isEmpty().isFloat({ min: 0.1, max: 24 }),
    check('id').custom(existReportById),
    validateFields
], updateReportById);

/**
 * Actualizar registro del time report del usuario logueado.
 * {{ url }}/api/reports/:id
 */
router.put('/celulas/:id', [
    validateJWT,
    check('date', 'La fecha es obligatoria').not().isEmpty(),
    check('activity', 'La actividad es obligatoria').not().isEmpty(),
    check('detail', 'El detalle es obligatorio').not().isEmpty(),
    check('hours', 'Las horas son obligatorias').not().isEmpty().isFloat({ min: 0.1, max: 24 }),
    check('id').custom(existReportById),
    validateFields
], updateReportCelulaById);

/**
 * Eliminar un registro del time report en la BD.
 * {{ url }}/api/reports/:id
 */
router.delete('/:id', [
    validateJWT,
    // isAdminRole,
    check('id', 'No es un id de Mongo válido').isMongoId(),
    check('id').custom(existReportById),
    validateFields,
], deleteReportById);

/**
 * Eliminar un registro del time report en la BD.
 * {{ url }}/api/reports/:id
 */
router.delete('/celulas/:id', [
    validateJWT,
    // isAdminRole,
    check('id', 'No es un id de Mongo válido').isMongoId(),
    check('id').custom(existReportById),
    validateFields,
], deleteReportCelulaById);


router.post('/ausentismos', [
    validateJWT
], createAusentimos);

// TODO: Para después
// router.delete('/hidden/reports', deleteAllHiddenReportsByUser);
// router.delete('/clear/deleted', clearDeletedReports);

/**
 * Obtiene las actividades que tiene asignadas el usuario en el project plan.
 * {{ url }}/api/reports/activities
 */
router.get('/activities', [
    validateJWT,
    // isActiveUser
], getAllActivitiesFromUser);


router.post('/holidays/colombia', setHolidaysNewColombia);
router.post('/holidays', setHolidays);

router.delete('/holidays/delete', deleteHolidaysTemp);


router.post('/otros/paises', setHolidaysOtrosPaises);

router.patch('/massive', [
    validateJWT
], deleteMassiveReports);

module.exports = router;
