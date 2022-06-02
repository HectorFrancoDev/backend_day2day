const { Schema, model } = require('mongoose');

const CountrySchema = Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre del país es obligatorio']
    },
    img: {
        type: String,
        default: '',
        required: [true, 'La imagen del país es obligaotria']
    },
    code: {
        type: String,
        trim: true,
        emun: ['CO', 'HN', 'CR', 'SV', 'PA', 'CAM']
    }


}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CountrySchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Country', CountrySchema);
