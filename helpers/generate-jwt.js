const jwt = require('jsonwebtoken');


/**
 * Generar el JWT de inicio de sesión
 * @param {Payload} payload 
 * @param {Boolean} remember 
 * @returns 
 */
const generateJWT = ( payload, remember = false ) => {

    return new Promise( (resolve, reject) => {

        // const payload = { id };

        jwt.sign( payload, process.env.SECRETORPRIVATEKEY, {
            expiresIn: remember ? '365d' : '5h'
        }, ( err, token ) => {
            if ( err ) {
                console.log(err);
                reject( 'No se pudo generar el token' )
            } else {
                resolve( token );
            }
        });
    });
};

module.exports = {
    generateJWT
};

