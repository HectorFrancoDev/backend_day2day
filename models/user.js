const { Schema, model } = require('mongoose');

const UserSchema = Schema({
    area: {
        type: Schema.Types.ObjectId,
        ref: 'Area',
        required: [true, 'La área es obligatoria'],
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        required: [true, 'El correo es obligatorio'],
        unique: true
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'La contraseña es obligatoria'],
    },
    img: {
        type: String,
        default: ''
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    state: {
        type: Boolean,
        default: true
    },
    google: {
        type: Boolean,
        default: true
    },
    supervised_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }


}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

UserSchema.methods.toJSON = function () {
    const { __v, password, _id, ...user } = this.toObject();
    user.id = _id;
    return user;
};

module.exports = model('User', UserSchema);
