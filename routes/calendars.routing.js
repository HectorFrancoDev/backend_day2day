const { Router } = require('express');
const { check } = require('express-validator');

const {
    validateFields, validateJWT,
    // validarJWT,
    // esAdminRole,
    // tieneRole
} = require('../middlewares');

const {createHolidays } = require('../controllers/calendars.controller');


const router = Router();

router.post('/create', [

], createHolidays );


module.exports = router;
