const { response, request } = require('express');

const Role = require('../models/role.model');

/**
 * Crea un nuevo país en la base de datos.
 * @param {Request} req 
 * @param {Response} res 
 */
const createRole = async (req, res = response) => {

    const { code = 'AUDITOR_ROLE', name = 'Auditor' } = req.body;

    const verifyRole = await Role.findOne({ code });


    if (verifyRole)
        return res.status(400).json({ error: `Ya hay un role con ese código: ${verifyRole.name}` });

    const role = new Role({ name, code });

    await role.save();

    res.json({ role });

};


const getRoles = async (req = request, res = response) => {

    const [total, roles] = await Promise.all([
        Role.countDocuments(),
        Role.find()
    ]);

    res.status(200).json({ total, roles });
}

const createRolesScript = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de roles' });

    for (let i = 0; i < data.length; i++) {

        const { code = 'AUDITOR_ROLE', name = 'Auditor' } = data[i];

        const role = new Role({ name, code });

        await role.save();
    }

    res.status(200).json({
        msg: "Roles cargados con éxito"
    });

};


module.exports = {
    getRoles,
    createRole,
    createRolesScript
};
