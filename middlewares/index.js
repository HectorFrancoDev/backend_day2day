const validateFields = require('./validate-fields');
const validateJWT = require('./auth/validate-jwt');

module.exports = {
    ...validateFields,
    ...validateJWT
};