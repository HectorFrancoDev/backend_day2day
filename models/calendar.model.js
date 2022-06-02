
/**
 * Agregar los festivos de todos los países desde el 2022 al 2030
 */

const { Schema, model } = require('mongoose');

const CalendarSchema = Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre del día festivo es obligatorio']
    },
    country: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'El país es obligatorio']
    },
    date: {
        type: Date,
        required: [true, 'La fecha es obligatoria']
    },
    code: {
        type: Number,
        trim: true,
    }

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CalendarSchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Calendar', CalendarSchema);
