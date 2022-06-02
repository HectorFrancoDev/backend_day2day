const { response, request } = require('express');

const Country = require('../models/country.model');

/**
 * Crea un nuevo país en la base de datos.
 * @param {Request} req 
 * @param {Response} res 
 */
const createCountry = async (req, res = response) => {

    const { code = 'CO', img = '', name = 'Colombia' } = req.body;

    const verifyCountry = await Country.findOne({ code });


    if (verifyCountry)
        return res.status(400).json({ error: `Ya hay un país con ese código: ${verifyCountry.name}` });

    const country = new Country({ name, code, img });

    await country.save();

    res.json({ country });

};


const getCountries = async (req = request, res = response) => {

    const countries = await Country.find();

    res.status(200).json({ countries });
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createCountriesScript = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de países' });

    for (let i = 0; i < data.length; i++) {

        const { code = 'CO', img = '', name = 'Colombia' } = data[i];

        const country = new Country({ name, code, img });

        await country.save();
    }

    res.status(200).json({
        msg: "Páises cargados con éxito"
    });

};

module.exports = {
    getCountries,
    createCountry,
    createCountriesScript
};