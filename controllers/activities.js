const { response, request } = require('express');
const Activity = require('../models/activity');
const Company = require('../models/company.model');
const Category = require('../models/categories.model');
const Celula = require('../models/celula.model');
const User = require('../models/user');

const createActivity = async (req = request, res = response) => {

    const {
        codigo_open = 'AUD_0000',
        company = 1, // Banco Davivienda
        category = 13, // auditorias
        name = 'Auditoría ABC',
        celula_name = 'A',
        initial_date = new Date('2023-01-01'),
        end_date = new Date('2023-01-31'),
        estimated_hours = 1,
        open_state = true,
        is_general = false,
    } = req.body;

    // Get Company
    const getCompany = await Company.findOne({ code: company });

    if (!getCompany)
        return res.status(401).json({ error: 'No existe la empresa seleccionada' });

    // Get Category
    const getCategory = await Category.findOne({ code: category });

    if (!getCategory)
        return res.status(401).json({ error: 'No existe la categoría seleccionada' });

    // Get Célula
    const getCelula = await Celula.findOne({ name: celula_name });

    if (!getCelula)
        return res.status(401).json({ error: 'No existe la celula seleccionada' });

    // Verify Activity
    const verifyActivity = await Activity.findOne({ codigo_open });

    if (verifyActivity)
        return res.status(401).json({ error: 'Esta actividad ya existe en el Project Plan' });


    // Crear Actividad nueva
    const activity = new Activity({
        codigo_open,
        getCategory,
        getCompany,
        name,
        getCelula,
        initial_date,
        end_date,
        estimated_hours,
        open_state,
        is_general
    });

    // Guardar en BD
    await activity.save();

    res.json({ activity });

};


const createActivitiesScript = async (req, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(401).json({ error: 'No existe el arreglo data en la petición' });

    if (data.length === 0)
        return res.status(401).json({ error: 'No hay datos en el arreglo data' });

    // Contador de aduitoías repetidas
    const aud_repetidas = [];

    for (let i = 0; i < data.length; i++) {

        const {
            codigo_open = 'AUD_0000',
            company = 1, // Banco Davivienda
            category = 13, // auditorias
            name = 'Auditoría ABC',
            celula_name = 'A',
            initial_date = new Date('2023-01-01'),
            end_date = new Date('2023-01-31'),
            estimated_hours = 1,
            open_state = true,
            is_general = false,

        } = data[i];

        // Get Company
        const getCompany = await Company.findOne({ code: company });

        if (!getCompany)
            return res.status(401).json({ error: 'No existe la empresa seleccionada' + ' CÓDIGO OPEN: ' + codigo_open });

        // Get Category
        const getCategory = await Category.findOne({ code: category });

        if (!getCategory)
            return res.status(401).json({ error: 'No existe la categoría seleccionada' + ' CÓDIGO OPEN: ' + codigo_open });

        // Get Célula
        const getCelula = await Celula.findOne({ name: celula_name });

        if (!getCelula)
            return res.status(401).json({ error: 'No existe la celula seleccionada' + ' CÓDIGO OPEN: ' + codigo_open });

        // Verify Activity
        const verifyActivity = await Activity.findOne({ codigo_open });

        if (verifyActivity) {
            // return res.status(401).json({ error: 'Esta actividad ya existe en el Project Plan' + ' CÓDIGO OPEN: ' + codigo_open }); 
            aud_repetidas.push(codigo_open);
            continue;
        }

        // Crear actividad / misión
        const activity = new Activity({
            codigo_open,
            category: getCategory,
            company: getCompany,
            celula: getCelula,
            name,
            initial_date,
            end_date,
            estimated_hours,
            open_state,
            is_general
        });

        // Guardar en BD
        await activity.save();

    }

    res.json({
        msg: `Actividades / Misiones guardadas con éxito: ${data.length - aud_repetidas.length} / ${data.length}`,
        repetidas: `AUD Repetidas: ${aud_repetidas.length} a revisar`,
        aud_repetidas
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

/**
 * Asignar un usuario a una actividad en especifico
 * @param {Request} req 
 * @param {Response} res 
 */
const assignUserToActivityFirstTimeScript = async (req = request, res = response) => {

    const { data } = req.body;

    if (!data)
        return res.status(401).json({ error: 'Debes enviar el parámetro Data' });

    if (data.length === 0)
        return res.status(401).json({ error: 'El parámetro Data se encuentra vacío' });


    for (let i = 0; i < data.length; i++) {

        let activity = await Activity.findOne({ codigo_open: data[i].codigo_open });

        if (!activity)
            return res.status(401).json({ error: 'La actividad con código Open: ' + data[i].codigo_open + ' no existe' });

        // Resetear horas planeadas de la actividad como tal a cero (0)
        activity.estimated_hours = 0;

        for (let j = 0; j < data[i].users.length; j++) {

            const user = await User.findOne({ email: data[i].users[j].email });

            if (!user)
                return res.status(401)
                    .json({ error: 'No se encuentra el usuario "' + data[i].users[j].email + '" en la auditoría [' + data[i].codigo_open + ']' });

            // Verificar si el usuario ya existe o no
            // Si no existe se le asigna a la actividad
            // Si existe se salta la asignación de este
            const indexUser = await activity.users.findIndex((u) => u.user.toString() == user._id.toString());

            if (indexUser === -1) {

                activity.users.push({
                    user: user,
                    initial_date: new Date(data[i].users[j].initial_date),
                    end_date: new Date(data[i].users[j].end_date),
                    estimated_hours: data[i].users[j].planned_hours,
                    logs: [{ description: 'Auditor asignado' }]
                });
            }

        }

        // Sumatoria de las horas estimadas por auditor a la actividad / misión
        // con base a las horas asignadas por usuario dentro de la actividad / misión
        for (let u = 0; u < activity.users.length; u++) {
            activity.estimated_hours += activity.users[u].estimated_hours;
        }

        // TODO: Revisar antes de ejecutar
        await activity.save();

        // console.log(activity);
    }

    res.status(200).json({ msg: 'Usuarios asignados con éxito' });


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

/**
 * Obtener la lista de actividades que pertenecen a la categoría de ausentismos
 * @param {*} req 
 * @param {*} res 
 */
const getActividadesAusentismo = async (req, res = response) => {

    const user_id = req.user._id;

    if (!user_id)
        res.status(400).json({ error: 'No se encuentra el auditor ' });

    const ausentismo = await Category.findOne({ code: 1 });

    const activities = await Activity.find(
        {
            is_general: false, state: true, category: ausentismo
        })
        .populate({
            path: 'category', select: ['name', 'code']
        })

    res.status(200).json({ activities });
};


const openPages = async (req = request, res = response) => {


    const { data } = req.body;

    if (!data || data.length === 0) {
        res.status(400).json({ msg: 'No hay Data alguna' })
    }

    let contadorHallazgos = [];
    let contadorFallas = [];

    for (let i = 0; i < data.length; i++) {

        const { nombre, codigo, compania, cerrado = 'No', inicio_planificado_date, fin_planificado_date, horas_estimadas = 1 } = data[i];

        const company = await Company.findOne({ name: compania });

        if (!company) {
            contadorFallas.push({ compania })
        } else {

            const activity = await Activity.findOne({ name: nombre, company });


            if (activity) {

                activity.open_state = cerrado === 'Sí' ? false : true;
                activity.codigo_open = codigo;
                activity.estimated_hours = horas_estimadas;
                activity.initial_date = new Date(inicio_planificado_date);
                activity.end_date = new Date(fin_planificado_date);

                await activity.save();

                // contadorHallazgos.push({ nombre, codigo, compania })

            }
        }

    }

    res.status(200).json({ msg: 'Auditorías editadas de Open Pages' });

    // res.status(200).json({
    //     cantidad: contadorHallazgos.length, aud: contadorHallazgos,
    //     fallos: contadorFallas.length, fa: contadorFallas
    // });
}

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



const putInactiveOldActivities = async (req = request, res = response) => {

    const { year } = req.body;

    if (!year)
        return res.status(401).json({ error: 'Debes agregar un año de cierre de auditoría para desactivarlas' });

    const activities = await Activity.find({ is_general: false });


    // const filtrado = activities.filter((activity) => !activity.name.startsWith('INC'));
    const filtrado = activities.filter((activity) => activity.name.startsWith('INC'));


    for (let i = 0; i < filtrado.length; i++) {

        filtrado[i].state = false;
        // console.log(filtrado[i].name);

        for (let j = 0; j < filtrado[i].users.length; j++) {

            // console.log(":::::" + filtrado[i].users[j].user);
            filtrado[i].users[j].is_active = false;

        }

        await filtrado[i].save();
    }

    res.status(200).json({ msg: 'Auditorías pasadas eliminadas con éxito' });
}


const putInactiveOldActivitiesGeneral = async (req = request, res = response) => {


    const { year } = req.body;

    if (!year)
        return res.status(401).json({ error: 'Debes agregar un año de cierre de auditoría para desactivarlas' });

    const activities = await Activity.find({ is_general: true });


    for (let i = 0; i < activities.length; i++) {

        activities[i].state = false;
        await activities[i].save();
    }

    res.status(200).json({ msg: 'Auditorías pasadas eliminadas con éxito' });

}



module.exports = {
    createActivity,
    createActivitiesScript,
    assignUserToActivityFirstTimeScript,
    getActivityById,
    getActivities,
    assignActivity,
    getSpecificActivities,
    editActivities,
    deleteActivityById,
    editActivitiesCategories,
    openPages,
    getActividadesAusentismo,
    putInactiveOldActivities,
    putInactiveOldActivitiesGeneral
};
