const { response, request } = require('express');

const Country = require('../models/country.model');
const Company = require('../models/company.model')


const createCompany = async (req, res = response) => {

    const { code = 1, name = '', countryCode = 'CO' } = req.body;

    const verifyCountry = await Country.findOne({ code: countryCode });

    if (verifyCompany)
        return res.status(400).json({ error: 'Ya existe una compañia con este código' })

    const verifyCompany = await Company.findOne({ code });
    
    if (!verifyCountry)
        return res.status(400).json({ error: `Ingresa un país valido` });


    const company = new Company({ name, code, verifyCountry });

    await company.save();

    res.json({ company });

};


const getCompanies = async (req = request, res = response) => {


    const [total, companies] = await Promise.all([
        Company.countDocuments(),
        Company.find().populate({ path: 'country', select: ['name', 'code'] })
    ]);

    res.status(200).json({ total, companies });
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createCompaniesScript = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de compañias' });

    for (let i = 0; i < data.length; i++) {

        const { code = 1, name = '', countryCode } = data[i];

        const country = await Country.findOne({ code: countryCode });

        const company = new Company({ name, code, country });

        await company.save();
    }

    res.status(200).json({
        msg: "compañias cargadas con éxito"
    });

};

module.exports = {
    getCompanies,
    createCompany,
    createCompaniesScript
};