const { Schema, model } = require('mongoose');

const RoleSchema = Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre del role es obligatorio']
    },
    code: {
        type: String,
        trim: true,
        emun: ['VP_ROLE', 'DIRECTOR_ROLE', 'LEADER_ROLE', 'SUPERVISOR_ROLE', 'AUDITOR_ROLE']
    }

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

RoleSchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Role', RoleSchema);
