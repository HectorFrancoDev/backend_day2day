const { response, request } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

/**
 * Realiza la validación del token enviado desde el cliente.
 */
const validateJWT = async (req = request, res = response, next) => {

    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            error: 'No hay token en la petición'
        });
    }

    try {
        const { id } = jwt.verify(token, process.env.SECRETORPRIVATEKEY, { ignoreExpiration: true });


        // leer el usuario que corresponde al id
        const user = await User.findById(id)
            .populate({ path: 'role', select: ['name', 'code'] })
            .populate({
                path: 'area', select: ['name', 'code'],
                populate: { path: 'country', select: ['name', 'code', 'img'] }
            })
            .populate({
                path: 'celulas', select: ['celula'],
                populate: { path: 'celula', select: ['name', 'code'] }
            });

        // No existe el usuario con el token asociado.
        if (!user) {
            return res.status(401).json({
                error: 'Token no válido - el usuario no existe'
            })
        }

        // Verificar si el usuario esta activo
        if (!user.state) {
            return res.status(401).json({
                error: 'Usuario inactivo'
            })
        }

        // Si pasa todos los filtros
        req.user = user;
        next();
    }
    catch (error) {
        console.log(error);
        // console.log(error);
        res.status(401).json({
            error: 'Error consultando al usuario en la base de datos'
        });
    }
}

module.exports = {
    validateJWT
};