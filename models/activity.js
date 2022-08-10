const { Schema, model } = require('mongoose');


const ActivitySchema = Schema({
    // FIXME: Arreglar esto cuando venga
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es obligatoria'],
    },
    codigo_open: {
        type: String,
        trim: true,
        required: [false, 'Por ahora no es requerido el código de Open Pages']
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [false, 'Solo para actividades generales']
    },
    celula: {
        type: Schema.Types.ObjectId,
        ref: 'Celula',
        required: [false, 'Solo para actividades que pertenecen a una célula']
    },
    name: {
        type: String,
        trim: true,
        required: [true, 'El nombre es obligatorio']
    },
    open_state: {
        type: Boolean,
        default: false,
        required: [true, 'El estado en open es obligatorio'],
    },
    initial_date: {
        type: Date,
        required: [true, 'La fecha inicial es obligatoria']
    },
    end_date: {
        type: Date,
        required: [true, 'La fecha final es obligatoria']
    },
    estimated_hours: {
        type: Number,
        required: [true, 'La cantidad de horas estimadas es obligatoria']
    },
    worked_hours: {
        type: Number,
        default: 0
    },
    is_general: {
        type: Boolean,
        default: false,
        required: [true, 'Difinir si es una actividad general o no es obligatorio'],
    },

    // Usuarios asignados a la actividad
    users: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },

            // Estado dentro de la actividad
            // true: activo
            // false: desaactivado (salió, terminó)
            is_active: {
                type: Boolean,
                default: true
            },

            // Eventos del auditor en la actividad
            // Asignación, salida, retoma, terminación, etc ...
            logs: [
                {
                    date: {
                        type: Date,
                        default: new Date()
                    },
                    description: {
                        type: String,
                        default: 'Auditor nuevo'
                    }

                }
            ],

            // Horas trabajadas del auditor
            worked_hours: {
                type: Number,
                default: 0
            },

            // Horas estimadas que debe trabajar cada auditor
            // asignado a esta actividad
            estimated_hours: {
                type: Number,
                default: 1
            }
        }
    ],
    state: {
        type: Boolean,
        default: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

ActivitySchema.methods.toJSON = function () {
    const { __v, _id, ...data } = this.toObject();
    data.id = _id;
    return data;
};

module.exports = model('Activity', ActivitySchema);
