const { Router } = require('express');
const { check } = require('express-validator');

const {
    validateFields, validateJWT,
    // validarJWT,
    // esAdminRole,
    // tieneRole
} = require('../middlewares');


// const { isValidRole, emailExist, existeUsuarioPorId } = require('../helpers/db-validators');

const { getCountries, createCountry, createCountriesScript } = require('../controllers/countries.controller');
// const { isAdminRole } = require('../middlewares/auth/validate-roles');

const router = Router();

router.get('/', [
    // validateJWT,
    // isAdminRole
], getCountries );

router.post('/',[
    // validateJWT,
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('code', 'El código del páis es obligatorio').not().isEmpty(),
    check('img', 'La imagen del país es obligatoria').not().isEmpty(),
    // validateFields
], createCountry);

router.post('/script',[
    // validateJWT,
    // validateFields
], createCountriesScript);

module.exports = router;
