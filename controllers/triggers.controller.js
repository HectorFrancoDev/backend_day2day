const { response, request } = require('express');

/**
 * Despierta el Servidor
 * @param {Request} req 
 * @param {Response} res 
 */
const triggerWakeUp = async (req = request, res = response) => {

    res.status(200).json({ msg: 'Servidor despierto' });

};


module.exports = {
    triggerWakeUp,
};

