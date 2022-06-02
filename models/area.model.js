const { Schema, model } = require('mongoose');

const AreaSchema = Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre del área  es obligatorio']
    },
    country: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    },
    code: {
        type: Number,
        trim: true,
    }


}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

AreaSchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Area', AreaSchema);
