const { Schema, model } = require('mongoose');

const CelulaSchema = Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre de la célula es requerido']
    },
    code: {
        type: Number,
        trim: true
    }

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CelulaSchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Celula', CelulaSchema);
