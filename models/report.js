const { Schema, model } = require('mongoose');

const ReportSchema = Schema({
    date: {
        type: Date,
        required: [true, 'La fecha es obligatoria']
    },
    activity: {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        required: [true, 'La actividad es obligatoria']
    },
    detail: {
        type: String,
        trim: true,
        required: [true, 'El detalle es obligatorio']
    },
    hours: {
        type: Number,
        required: [true, 'La cantidad de horas es obligatoria']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    state: {
        type: Boolean,
        default: true,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

ReportSchema.methods.toJSON = function() {
    const { __v, _id, ...user  } = this.toObject();
    user.id = _id;
    return user;
}

module.exports = model('Report', ReportSchema );
