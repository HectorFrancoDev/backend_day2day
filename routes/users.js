const { Router } = require('express');
const { check } = require('express-validator');

const {
    validateFields, validateJWT,
    // validarJWT,
    // esAdminRole,
    // tieneRole
} = require('../middlewares');


// const { isValidRole, emailExist, existeUsuarioPorId } = require('../helpers/db-validators');

const { createUser, getUsers, getUserById, createUsersScript, assignSupervisor, editRoleAndArea } = require('../controllers/users');
const { isAdminRole } = require('../middlewares/auth/validate-roles');

const router = Router();

router.get('/', [
    // validateJWT,
    // isAdminRole
], getUsers );

router.get('/:id', [
    validateJWT
], getUserById );

// router.put('/:id',[
//     check('id', 'No es un ID válido').isMongoId(),
//     check('id').custom( existeUsuarioPorId ),
//     check('rol').custom( isValidRole ), 
//     validateFields
// ],usuariosPut );

router.post('/',[
    validateJWT,
    check('email', 'El correo no es válido').isEmail(),
    validateFields
], createUser);


router.post('/script', createUsersScript);

// router.delete('/:id',[
//     validarJWT,
//     // esAdminRole,
//     tieneRole('ADMIN_ROLE', 'VENTAR_ROLE','OTRO_ROLE'),
//     check('id', 'No es un ID válido').isMongoId(),
//     check('id').custom( existeUsuarioPorId ),
//     validateFields
// ],usuariosDelete );

router.patch('/editrole', editRoleAndArea );

router.patch('/assignsupervisor', assignSupervisor );


module.exports = router;