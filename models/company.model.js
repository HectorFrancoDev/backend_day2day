const { Schema, model } = require('mongoose');

const CompanySchema = Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre de la compañia es obligatorio']
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

CompanySchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Company', CompanySchema);
