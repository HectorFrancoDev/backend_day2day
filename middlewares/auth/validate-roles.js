const { response } = require('express')

/**
 * Verifica si el usuario es administrador.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const isAdminRole = (req, res = response, next) => {

    if (!req.user)
        return res.status(500).json({ msg: 'Se quiere verificar el role sin validar el token primero' });

    const { role, name } = req.user;

    if (role.code === 'AUDITOR_ROLE')
        return res.status(401).json({ msg: `${name} no es administrador - No puede hacer esto` });

    next();
}



module.exports = {
    isAdminRole
}