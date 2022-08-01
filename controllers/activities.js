const { response, request } = require('express');
const Activity = require('../models/activity');
const Company = require('../models/company.model');
const Category = require('../models/categories.model');

const createActivity = async (req = request, res = response) => {

    const {
        company = 1,
        name,
        initial_date,
        end_date,
        estimated_hours,
        open_state = true,
        is_general = false
    } = req.body;

    // Get Company
    const getCompany = await Company.findOne({ code: company });

    if (!getCompany)
        res.status(401).json({ error: 'No existe la empresa seleccionada' });

    // Verify Activity
    const verifyActivity = await Activity.findOne({ name: name, company: getCompany });

    if (verifyActivity)

        return res.status(401).json({ error: 'Esta actividad ya existe en el Project Plan' });


    // Crear Actividad nueva
    const activity = new Activity({
        company: getCompany, name, open_state, initial_date, end_date, estimated_hours, is_general
    });

    // Guardar en BD
    await activity.save();

    res.json({ activity });


};

const createActivitiesScript = async (req, res = response) => {

    const { data } = req.body;

    for (let i = 0; i < data.length; i++) {

        const {
            company = 1,
            name,
            open_state = true,
            initial_date = new Date(initial_date),
            end_date = new Date(end_date),
            estimated_hours,
            is_general = false,
            country = 'CO' } = data[i];

        const activity = new Activity({
            company,
            name,
            open_state,
            initial_date,
            end_date,
            estimated_hours,
            is_general,
            country
        });
        // Guardar en BD
        await activity.save();
    }

    res.json({
        ok: true
    });
};

const getActivities = async (req = request, res = response) => {


    console.log('Entraron activities.js:83');

    const { specific = false } = req.query;

    const query = (specific == true || specific == 'true') ? { is_general: false } : {};

    const [total, activities] = await Promise.all([
        Activity.countDocuments(query),
        Activity.find(query)
            .populate({
                path: 'users.user', select: ['name', 'email', 'area'],
                populate: { path: 'area', select: ['code', 'name'] }
            })
            .populate({
                path: 'company', select: ['name', 'code'],
                populate: { path: 'country', select: ['name', 'code', 'img'] }
            })
            .populate({
                path: 'category', select: ['name', 'code']
            })
    ]);

    res.json({ total, activities });
};

const getActivityById = async (req = request, res = response) => {

    console.log('Entraron activities.js:110');

    const { id } = req.params;
    if (!id)
        return res.status(400).json({ error: 'Debe enviar una actividad' });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('ESTALLÓ AQUÍ activities.js:117')
        return res.status(400).json({ error: 'Debe enviar un id de mongo válido' });
    }

    const [total, activity] = await Promise.all([
        Activity.countDocuments(id),
        Activity.findById(id)
            .populate({ path: 'users.user', select: ['name', 'email', 'img'] })
            .populate({
                path: 'company', select: ['name', 'code'],
                populate: { path: 'country', select: ['name', 'code', 'img'] }
            })
    ]);

    res.status(200).json({ total, activity });

}

const assignActivity = async (req = request, res = response) => {

    const { id } = req.params;

    if (!id)
        return res.status(400).json({ error: 'Debes enviar un id de actividad válido' });

    const {
        user_id,
        user_state_activity = true,
        user_estimated_hours_activity = 0,
        user_log_description_activity = 'Cambio de prueba',
        ...resto
    } = req.body;
    // const data = { user: user_id };

    let activity = await Activity.findById(id);

    if (activity.users.length !== 0) {


        // Verificar si el auditor ya está asignado
        const indexUser = activity.users.findIndex((user) => user.user == user_id);

        // Si el auditor ya está presenteestaba:
        if (indexUser !== -1) {

            // console.log(`Usuario ${user_id} previamente asignado`);

            // console.log("Creando log de evento nuevo");

            activity.users[indexUser].logs.push({
                description: user_log_description_activity
            });

            // Cambia el estado respecto si sale de la actividad o es reasignado de nuevo
            activity.users[indexUser].is_active = user_state_activity;

            // Cambia las horas de trabajo estimadas llegado el caso
            activity.users[indexUser].estimated_hours = user_estimated_hours_activity;

            // Guarda la actividad de nuevo
            await activity.save();

            res.status(200).json({ activity });
            return;
        }

        else {

            // console.log('Nuevo auditor asignado');

            // Agregar un auditor nuevo a la actividad
            activity.users.push({
                user: user_id,
                estimated_hours: user_estimated_hours_activity,
                logs: [{ description: 'Auditor asignado' }]
            });

            // Guardar actividad en la base colección
            await activity.save();
            res.status(200).json({ activity });

            return;
        }

    } else {
        // console.log("Asignación primer auditor a la actividad");

        // Se le va asignar el primer auditor a la actividad.
        activity.users = [{
            user: user_id,
            estimated_hours: user_estimated_hours_activity,
            logs: [{
                description: 'Primer auditor asignado'
            }]
        }];

        await activity.save();
        res.status(200).json({ activity });

        return;
    }
}

const getSpecificActivities = async (req, res = response) => {

    const user_id = req.user._id;

    if (!user_id)
        res.status(400).json({ error: 'No se encuentra el auditor ' })

    const activities = await Activity.find(
        {
            $or: [
                { users: { $elemMatch: { user: user_id, is_active: true } } },
                { is_general: true, state: true }
            ]
        })
        .populate({
            path: 'company', select: ['name', 'code'],
            populate: { path: 'country', select: ['name', 'code', 'img'] }
        })
        .populate({
            path: 'category', select: ['name', 'code']
        })

    res.json({ activities });
};

const getActividadesAusentismo = async (req, res = response) => {

    const user_id = req.user._id;

    if (!user_id)
        res.status(400).json({ error: 'No se encuentra el auditor ' })

    const activities = await Activity.find(
        {
            is_general: true, state: true
        })
        .populate({
            path: 'category', select: ['name', 'code']
        })

    res.json({ activities });
};

const editActivities = async (req = request, res = response) => {

    const { data } = req.body;

    let contadorFallas = [];

    for (let i = 0; i < data.length; i++) {

        const { id, newName, companyCode = 1 } = data[i];

        const company = await Company.findOne({ code: companyCode });

        if (!company) {
            contadorFallas.push(id);
        }
        else {
            // Buscar actividad por id y actualizar campos
            const activity = await Activity.findByIdAndUpdate(
                id,
                { company, name: newName, open_state: true, $unset: { country: '' } },
                { new: true }
            );

            await activity.save();
        }
    }

    if (contadorFallas.length > 0) {
        res.status(401).json({
            contadorFallas: `Actividades no editadas: ${contadorFallas}`
        });

    } else {
        res.status(201).json({ msg: 'Actividades editadas con éxito' });
    }

}


const editActivitiesCategories = async (req = request, res = response) => {

    const { data } = req.body;

    let contadorFallas = [];

    for (let i = 0; i < data.length; i++) {

        const { name, categoryCode = 1 } = data[i];

        const category = await Category.findOne({ code: categoryCode });

        if (!category) {
            contadorFallas.push(id);
        }
        else {

            // Buscar actividad por id y actualizar campos
            const activity = await Activity.findOneAndUpdate(
                // { name: { $regex: `/${name}/` } },
                { name },
                { category },
                { new: true }
            );

            await activity.save();
        }
    }

    if (contadorFallas.length > 0) {
        res.status(401).json({
            contadorFallas: `Actividades no editadas: ${contadorFallas}`
        });

    } else {
        res.status(201).json({ msg: 'Actividades editadas con éxito' });
    }

}


const deleteActivityById = async (req = request, res = response) => {

    const { id } = req.params;

    if (!id)
        return res.status(400).json({ error: 'Debes enviar un id de actividad válido' });

    const activity = await Activity.findById(id);

    if (!activity)
        return res.status(401).json({ error: 'No se encuentra la actividad en cuestión' });

    activity.state = false;

    await activity.save();

    res.status(201).json(activity);

}

module.exports = {
    createActivity,
    createActivitiesScript,
    getActivityById,
    getActivities,
    assignActivity,
    getSpecificActivities,
    editActivities,
    deleteActivityById,
    editActivitiesCategories,
    getActividadesAusentismo
};
