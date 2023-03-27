const { response, request } = require('express');
const bcryptjs = require('bcryptjs');

const User = require('../models/user');
const Role = require('../models/role.model');
const Area = require('../models/area.model');
const Celula = require('../models/celula.model');


const assignCellsToUser = async (req = request, res = response) => {

    const { cell_code, users = [] } = req.body;

    if (users.length == 0)
        return res.status(400).json({ error: 'No hay usuarios a quien asignar' })

    const verifyCell = await Celula.findOne({ name: cell_code })

    if (!verifyCell)
        return res.status(400).json({ error: 'No se encuentra la célula ' })

    const inactive_users = [];

    for (let i = 0; i < users.length; i++) {

        const user = await User.findOne({ email: users[i] })

        if (!user)
            return res.status(401)
                .json({ error: 'No se encuentra el usuario "' + users[i] });

        if (!user.state) {
            inactive_users.push(users[i]);
            continue;
        }

        // Verificar si ya tiene la célula asignada o no
        // Si no existe se le asigna la célula
        // Si existe se salta la asignación de este 
        const indexCelula = await user.celulas.findIndex((c) => {
            console.log(c);
            return c.celula.toString() == verifyCell._id.toString()
        });

        if (indexCelula === -1) {

            user.celulas.push({ celula: verifyCell });
            await user.save();
        }

    }

    res.status(200).json({ msg: 'Usuarios asignados con éxito', inactive_users, total_inactivos: `Usuarios inactivos en la plataforma: ${inactive_users.length}` });



}

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {Request} req 
 * @param {Response} res 
 */

const createUser = async (req, res = response) => {

    const {
        areaCode,
        name = '',
        email,
        password = process.env.TEMP_PASSWORD,
        roleCode,
        img = '',
        google = true } = req.body;

    const verifyUser = await User.findOne({ email });


    if (verifyUser)
        return res.status(400).json({ error: 'El usuario ya se encuentra registrado' });


    const role = await Role.findOne({ code: roleCode });
    if (!role)
        return res.status(400).json({ error: 'Ingrese un código de role válido' });


    const area = await Area.findOne({ code: areaCode });
    if (!area)
        return res.status(400).json({ error: 'Ingrese un código de área válido' });


    const user = new User({ area, name, email, password, role, img, google });

    // Encriptar la contraseña
    const salt = bcryptjs.genSaltSync();
    user.password = bcryptjs.hashSync(password, salt);


    // Guardar en BD
    await user.save();

    res.json({ user });

};

const getUsers = async (req = request, res = response) => {

    const [total, users] = await Promise.all([

        User.countDocuments(),
        User.find()
            .populate({ path: 'role', select: ['name', 'code'] })
            .populate({ path: 'area', select: ['name', 'code'], populate: { path: 'country', select: ['name', 'code', 'img'] } })
            .populate({ path: 'celulas', select: ['celula'], populate: { path: 'celula', select: ['name', 'code'] }})
    ])

    res.status(200).json({ total, users });
}

const getUserById = async (req = request, res = response) => {

    const { id } = req.params;

    const user = await User.findById(id)
        .populate({ path: 'role', select: ['name', 'code'] })
        .populate({ path: 'area', select: ['name', 'code'], populate: { path: 'country', select: ['name', 'code', 'img'] } })

    res.status(200).json({ user });
}

const usuariosPut = async (req, res = response) => {

    const { id } = req.params;
    const { _id, password, google, correo, ...resto } = req.body;

    if (password) {
        // Encriptar la contraseña
        const salt = bcryptjs.genSaltSync();
        resto.password = bcryptjs.hashSync(password, salt);
    }

    const usuario = await Usuario.findByIdAndUpdate(id, resto);

    res.json(usuario);
}

const editRoleAndArea = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de usuarios' });

    for (let i = 0; i < data.length; i++) {

        const { email, roleCode, areaCode } = data[i];

        const findRole = await Role.findOne({ code: roleCode });
        const findArea = await Area.findOne({ code: areaCode });

        if (findRole && findArea) {
            const user = await User.findOneAndUpdate(
                { email },
                { role: findRole, area: findArea, $unset: { rol: '', country: '' } },
                { new: true }
            );
            await user.save();
        }

    }

    res.status(200).json({ msg: "Usuarios editados cargados con éxito" });
}

const assignSupervisor = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de usuarios' });


    for (let i = 0; i < data.length; i++) {

        const { email, emailSupervisor } = data[i];

        const findSupervisor = await User.findOne({ email: emailSupervisor });


        if (findSupervisor) {

            const user = await User.findOneAndUpdate({ email }, { supervised_by: findSupervisor }, { new: true });
            await user.save();
        }

    }

    res.status(200).json({ msg: "Supervisor asignado con éxito" });

}

const usuariosDelete = async (req, res = response) => {

    const { id } = req.params;
    const usuario = await Usuario.findByIdAndUpdate(id, { state: false });


    res.status(200).json(usuario);
}

const createUsersScript = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de usuarios' });

    for (let i = 0; i < data.length; i++) {

        const {
            areaCode = 1,
            name,
            email,
            password = process.env.TEMP_PASSWORD,
            roleCode = process.env.TEMP_ROLE,
            img = '',
            google = true
        } = data[i];


        const role = await Role.findOne({ code: Number(roleCode) });
        if (!role)
            return res.status(400).json({ error: 'Ingrese un código de role válido' });


        const area = await Area.findOne({ code: areaCode });
        if (!area)
            return res.status(400).json({ error: 'Ingrese un código de área válido' });


        const user = new User({ area, name, email, password, role, img, google });


        // Encriptar la contraseña
        const salt = bcryptjs.genSaltSync();
        user.password = bcryptjs.hashSync(password, salt);

        // Guardar en BD
        await user.save();
    }

    res.status(200).json({
        msg: "Usuarios cargados con éxito"
    });

};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    usuariosPut,
    editRoleAndArea,
    usuariosDelete,
    assignSupervisor,
    createUsersScript,

    assignCellsToUser
};
