const { config } = require('dotenv');
const { response, request } = require('express');

const fetch = require("node-fetch");


const Country = require('../models/country.model');

const createHolidays = async (req = request, res = response) => {

    const { countryCode = 'CO', year = '2022' } = req.params;

    const country = await Country.findOne({ code: countryCode });

    if (!country)
        res.status(401).json({ error: 'Consulte un país válido' });

    const URL = `${process.env.ENDPOINT_HOLIDAYS}?api_key=${process.env.API_KEY_HOLIDAYS}&country=${countryCode}&year=${year}`;

    const options = {
        method: "GET"
    };

    fetch(URL, options).then((data) => console.log(data));

}

module.exports = {

    createHolidays
}