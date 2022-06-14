const { Router } = require('express');
const { check } = require('express-validator');

const {
    validateFields, validateJWT,

} = require('../middlewares');


const { createCelula, getCelulas, createCelulasScript, asignCelulaToActivity } = require('../controllers/celulas.controller');

const router = Router();

router.get('/', [
    validateJWT,
    // isAdminRole
], getCelulas );

router.post('/',[
    validateJWT,
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('code', 'El código de la empresa es obligatorio').not().isEmpty(),
    // validateFields
], createCelula);

router.post('/script',[
    // validateJWT,
    // validateFields
    check('data', 'El campo data es obligatorio').not().isEmpty(),
], createCelulasScript);

/**
 * 
 */
router.post('/assign',[
    // validateJWT,
    // validateFields
    check('data', 'El campo data es obligatorio').not().isEmpty(),
], asignCelulaToActivity);

module.exports = router;

