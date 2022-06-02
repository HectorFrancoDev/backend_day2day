const { response, request } = require('express');

const Country = require('../models/country.model');
const Area = require('../models/area.model')


const createArea = async (req, res = response) => {

    const { code = 1, name = 'Ciberseguridad y TI', countryCode = 'CO' } = req.body;

    const verifyCountry = await Country.findOne({ code: countryCode });

    if (!verifyCountry)
        return res.status(400).json({ error: `Ingresa un país valido` });


    const area = new Area({ name, code, verifyCountry });

    await area.save();

    res.json({ area });

};


const getAreas = async (req = request, res = response) => {


    const [total, areas] = await Promise.all([
        Area.countDocuments(),
        Area.find().populate({ path: 'country', select: ['name', 'code'] })
    ]);

    res.status(200).json({ total, areas });
}


const createAreasScript = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de compañias' });

    for (let i = 0; i < data.length; i++) {

        const { code = 1, name = 'Ciberseguridad y TI', countryCode = 'CO' }  = data[i];

        const country = await Country.findOne({ code: countryCode });

        if (country) {
            const area = new Area({ name, code, country });
            await area.save();
        }

    }

    res.status(200).json({
        msg: "areas cargadas con éxito"
    });

};

module.exports = {
    getAreas,
    createArea,
    createAreasScript
};