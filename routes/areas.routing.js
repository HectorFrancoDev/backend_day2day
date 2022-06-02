const { Router } = require('express');
const { check } = require('express-validator');

const {
    validateFields, validateJWT,
    // validarJWT,
    // esAdminRole,
    // tieneRole
} = require('../middlewares');


// const { isValidRole, emailExist, existeUsuarioPorId } = require('../helpers/db-validators');

const { getAreas, createArea, createAreasScript } = require('../controllers/area.controller');
// const { isAdminRole } = require('../middlewares/auth/validate-roles');

const router = Router();

router.get('/', [
    // validateJWT,
    // isAdminRole
], getAreas );

router.post('/',[
    // validateJWT,
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('code', 'El código del área es necesario').not().isEmpty(),
    check('countryCode', 'El código del país es necesario').not().isEmpty(),
    // validateFields
], createArea);

router.post('/script',[
    // validateJWT,
    // validateFields
], createAreasScript);

module.exports = router;
