const { Router } = require('express');
const { check } = require('express-validator');
const { getCategories, createCategory, createCategoriesScript } = require('../controllers/categories.controller');

const {
    validateFields, validateJWT,
    // validarJWT,
    // esAdminRole,
    // tieneRole
} = require('../middlewares');

const router = Router();

router.get('/', [
    validateJWT,
    // isAdminRole
], getCategories );

router.post('/',[
    validateJWT,
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('code', 'El código de la empresa es obligatorio').not().isEmpty(),
    // validateFields
], createCategory);

router.post('/script',[
    // validateJWT,
    // validateFields
], createCategoriesScript);

module.exports = router;
