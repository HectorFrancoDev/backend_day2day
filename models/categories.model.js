const { Schema, model } = require('mongoose');

const CategorySchema = Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre de la compañia es obligatorio']
    },
    code: {
        type: Number,
        trim: true,
    }


}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CategorySchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Category', CategorySchema);