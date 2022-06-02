const { Router } = require('express');
const { check } = require('express-validator');

const {
    validateFields, validateJWT,
    // validarJWT,
    // esAdminRole,
    // tieneRole
} = require('../middlewares');


// const { isValidRole, emailExist, existeUsuarioPorId } = require('../helpers/db-validators');

const { getCompanies, createCompany, createCompaniesScript } = require('../controllers/companies.controller');
// const { isAdminRole } = require('../middlewares/auth/validate-roles');

const router = Router();

router.get('/', [
    validateJWT,
    // isAdminRole
], getCompanies );

router.post('/',[
    validateJWT,
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('code', 'El código de la empresa es obligatorio').not().isEmpty(),
    check('country', 'El país de la empresa es obligatorio').not().isEmpty(),
    // validateFields
], createCompany);

router.post('/script',[
    // validateJWT,
    // validateFields
], createCompaniesScript);

module.exports = router;
