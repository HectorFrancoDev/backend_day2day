const { Router } = require('express');
const { check } = require('express-validator');

const {
    validateFields, validateJWT,
    // validarJWT,
    // esAdminRole,
    // tieneRole
} = require('../middlewares');


// const { isValidRole, emailExist, existeUsuarioPorId } = require('../helpers/db-validators');

const { getRoles, createRole, createRolesScript } = require('../controllers/roles.controller');
// const { isAdminRole } = require('../middlewares/auth/validate-roles');

const router = Router();

router.get('/', [
    // validateJWT,
    // isAdminRole
], getRoles );

router.post('/',[
    // validateJWT,
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('code', 'El código del role es necesario').not().isEmpty(),
    // validateFields
], createRole);

router.post('/script',[
    // validateJWT,
    // validateFields
], createRolesScript);

module.exports = router;
