const { Router } = require('express');
const { check } = require('express-validator');
const { createActivity, getActivities, assignActivity,
    getSpecificActivities, createActivitiesScript, getActivityById, editActivities, deleteActivityById, editActivitiesCategories, getActividadesAusentismo, openPages } = require('../controllers/activities');

const {
    validateFields, validateJWT
} = require('../middlewares');

const { isAdminRole } = require('../middlewares/auth/validate-roles');

const router = Router();

router.get('/', [
    validateJWT
], getActivities);


router.get('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId()
], getActivityById);

router.patch('/edit', editActivities);

router.patch('/edit/categories', editActivitiesCategories);

router.patch('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    // check('id').custom( existeUsuarioPorId ),
    // check('rol').custom( isValidRole ), 
    validateFields
], assignActivity);

router.delete('/:id', [
    validateJWT,
    isAdminRole
], deleteActivityById)

router.post('/', [
    validateJWT,
    isAdminRole,
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('initial_date', 'La fecha inicial es obligatoria').not().isEmpty(),
    check('end_date', 'La fecha final es obligatoria').not().isEmpty(),
    check('estimated_hours', 'El estimado de horas es obligatorio').not().isEmpty(),
    check('is_general', 'General o no es obligatorio').not().isEmpty(),
    validateFields
], createActivity);


router.post('/specific', [
    validateJWT,
    // isAdminRole,
    // check('name', 'El nombre es obligatorio').not().isEmpty(),
    // check('initial_date', 'La fecha inicial es obligatoria').not().isEmpty(),
    // check('end_date', 'La fecha final es obligatoria').not().isEmpty(),
    // check('estimated_hours', 'El estimado de horas es obligatorio').not().isEmpty(),
    // check('is_general', 'General o no es obligatorio').not().isEmpty(),
    // validateFields
], getSpecificActivities);


router.post('/ausentismos', [
    validateJWT,
    // isAdminRole,
    // check('name', 'El nombre es obligatorio').not().isEmpty(),
    // check('initial_date', 'La fecha inicial es obligatoria').not().isEmpty(),
    // check('end_date', 'La fecha final es obligatoria').not().isEmpty(),
    // check('estimated_hours', 'El estimado de horas es obligatorio').not().isEmpty(),
    // check('is_general', 'General o no es obligatorio').not().isEmpty(),
    // validateFields
], getActividadesAusentismo);


router.post('/script', createActivitiesScript);


router.post('/open/pages', openPages);


module.exports = router;
