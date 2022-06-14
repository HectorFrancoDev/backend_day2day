const { response, request } = require('express');

const Celula = require('../models/celula.model');
const Activity = require('../models/activity');

/**
 * Crea un nuevo país en la base de datos.
 * @param {Request} req 
 * @param {Response} res 
 */
const createCelula = async (req = request, res = response) => {

    const { code = 1, name = 'Celula Operativa' } = req.body;

    const verifyCelula = await Celula.findOne({ code });


    if (verifyCelula)
        return res.status(400).json({ error: `Ya hay una célula con ese código: ${verifyCelula.name}` });

    const celula = new Celula({ name, code });

    await celula.save();

    res.json({ celula });

};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
const getCelulas = async (req = request, res = response) => {

    const celulas = await Celula.find();

    res.status(200).json({ celulas });
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createCelulasScript = async (req = request, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de células' });

    for (let i = 0; i < data.length; i++) {

        const { code = 1, name = 'Celula' } = data[i];

        const celula = new Celula({ name, code });
        await celula.save();
    }

    res.status(200).json({
        msg: "Células cargados con éxito"
    });

};

/**
 * Asignar celulas a las actividades especificas
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const asignCelulaToActivity = async (req = request, res = response) => {

    let contadorFallas = [];

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de actividades a asignar célula' });


    for (let i = 0; i < data.length; i++) {

        const { auditoriaCode = '', celulaCode = 1 } = data[i];

        const celula = await Celula.findOne({ code: celulaCode });

        if (!celula) {
            contadorFallas.push(id);
        }

        else {

            // Buscar actividad por id y actualizar campos
            const activity = await Activity.findByIdAndUpdate(
                auditoriaCode,
                { celula },
                { new: true }
            )

            await activity.save();
        }
    }

    if (contadorFallas.length > 0)
        res.status(401).json({ contadorFallas: `Actividades no editadas: ${contadorFallas}` });

    else
        res.status(201).json({ msg: 'Actividades editadas con éxito' });

}

module.exports = {
    getCelulas,
    createCelula,
    createCelulasScript,
    asignCelulaToActivity
};

