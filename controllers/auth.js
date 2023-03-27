const { response, request } = require('express');
const bcryptjs = require('bcryptjs')

const User = require('../models/user');

const { generateJWT } = require('../helpers/generate-jwt');

/**
 * Permite loguearse en el sistema a un usuario (JWT)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const login = async (req, res = response) => {

    const { email, password } = req.body;
    const remember = true;

    try {
        // Verificar si el email existe
        // const user = await User.findOne({ $or: [{ email }, { username: email }] });
        let user = await User.findOne({ email })
            .populate({ path: 'role', select: ['name', 'code'] })
            .populate({
                path: 'area', select: ['name', 'code'],
                populate: { path: 'country', select: ['name', 'code', 'img'] }
            })
            .populate({
                path: 'celulas', select: ['celula'],
                populate: { path: 'celula', select: ['name', 'code'] }
            });

        if (!user) //El usuario no existe.
        {
            return res.status(400).json({
                error: 'El usuario no se encuentra registrado!'
            });
        }

        // SI el usuario NO está activo
        if (!user.state) {
            return res.status(400).json({
                error: 'El usuario no se encuentra activo en el sistema!'
            });
        }

        // Verificar la contraseña
        const validPassword = bcryptjs.compareSync(password, user.password);
        if (!validPassword) // Contraseña inválida
        {
            return res.status(400).json({
                error: 'La contraseña NO es correcta!'
            });
        }

        // Generar el JWT
        const payload = {
            id: user.id
        };

        const token = await generateJWT(payload, remember);

        res.json({
            user,
            token
        });
    }
    catch (error) {
        // console.log(error)
        res.status(500).json({
            msg: 'error',
            error
        });
    }
};

/**
 * Permite loguearse en el sistema a un usuario (JWT)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getLoggedUser = (req, res = response) => {

    const user = req.user;

    return res.json({ user });
};

/**
 * Login con credenciales de Google
 * @param {Reques} req 
 * @param {Response} res 
 * @returns {User, Token} retorna el token de JWT y el usuario de la BD
 */
const googleSignIn = async (req = request, res = response) => {


    try {

        const { idToken } = req.body;

        if (!idToken)
            return res.status(401).json({ error: 'no se pudo verificar el token de google' });

        // Obtiene el email, nombre y fotografía del usuario
        // que está haciendo login con sus credenciales de Google
        const { email, photoUrl, name } = req.body;

        // Busca el usuario registrado de la base de datos
        let user = await User.findOne({ email })
            .populate({ path: 'role', select: ['name', 'code'] })
            .populate({
                path: 'area', select: ['name', 'code'],
                populate: { path: 'country', select: ['name', 'code', 'img'] }
            })
            .populate({
                path: 'celulas', select: ['celula'],
                populate: { path: 'celula', select: ['name', 'code'] }
            });

        // Verificaciones de seguridad

        //El usuario no existe.
        if (!user)
            return res.status(400).json({
                error: 'No se encuentra registrado en la plataforma'
            });

        // Si el usuario NO está activo
        if (!user.state)
            return res.status(400).json({
                error: 'El usuario no se encuentra activo en el sistema!'
            });

        // Si el usuario no tiene permitido loguearse con Google
        if (!user.google)
            return res.status(400).json({
                error: 'El usuario no puede iniciar sesión con su cuenta de Google'
            });

        // Una vez pasó todos los filtros
        // Generar el JWT
        const payload = { id: user.id };
        const token = await generateJWT(payload, true);

        // Actualiza la foto y el nombre del usuario con base a como 
        // esté registrado en su cuenta de Google.

        if (user.name != name || user.img != photoUrl)
            user = await User.findOneAndUpdate({ email }, { img: photoUrl, name }, { new: true })
                .populate({ path: 'role', select: ['name', 'code'] })
                .populate({
                    path: 'area', select: ['name', 'code'],
                    populate: { path: 'country', select: ['name', 'code', 'img'] }
                })
                .populate({
                    path: 'celulas', select: ['celula'],
                    populate: { path: 'celula', select: ['name', 'code'] }
                });


        // Retorna el usuario y su respectivo token
        res.status(200).json({ user, token });

    } catch (error) {

        res.status(400).json({ error: 'Error de autentificación, refresca la página por favor' });
    }

}

module.exports = {
    login,
    googleSignIn,
    getLoggedUser
};
