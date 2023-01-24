const { Router } = require('express');
const { check } = require('express-validator');
const { login, getLoggedUser, googleSignIn } = require('../controllers/auth');

const { validateFields, validateJWT } = require('../middlewares');

const router = Router();

router.post('/login', [
    check('email', 'El email es obligatorio').isString(),
    check('password', 'La contraseña es obligatoria').not().isEmpty().isLength({ min: 8 }),
    validateFields
], login);


router.post('/google', [
    check('idToken', 'id_token es obligatorios').not().isEmpty(),
], googleSignIn);


router.get('/me', [
    validateJWT
], getLoggedUser);

module.exports = router;
