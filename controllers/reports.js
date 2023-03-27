const { response, request } = require('express');
const { populate } = require('../models/activity');
const Activity = require('../models/activity');
const Report = require('../models/report');
const User = require('../models/user');
const Role = require('../models/role.model');
const Country = require('../models/country.model');
const Area = require('../models/area.model');

const process = require('process');

const fc = require('festivos-colombia');

const moment = require('moment');


/**
 * Crea un nuevo registro en el time report del usuario.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createReport = async (req, res = response) => {

    console.log('Entraron reports.js:25');

    // Generar la data a guardar
    const { ...data } = req.body;

    data.hours = Number(data.hours);
    data.user = req.user._id + '';

    if (data.activity === null || typeof (data.activity) !== 'string')
        return res.status(400).json({ error: 'No es posible cargar la actividad' });

    if (!data.activity.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).json({ error: 'No es un ID válido de Mongo' });

    // Crear reporte de la actividad
    const report = new Report(data);

    // Buscar actividad como tal en la BD
    const activity = await Activity.findById(data.activity);

    // Actualizar el número de horas trabajadas por el usuario en la actividad / misión
    activity.users[data.position_user].worked_hours += data.hours;
    activity.worked_hours += data.hours;


    // Guardar DB
    await report.save();
    await activity.save();

    res.status(201).json(report);

    // TODO: Editar o eliminar luego :)
    for (const [key, value] of Object.entries(process.memoryUsage())) {
        console.log(`Memory usage by ${key}, ${value / 1000000}MB`);
    }

};

/**
 * Crea un nuevo registro en el time report del usuario si posee célula alguna.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */

const createReportCelula = async (req = request, res = response) => {

    console.log('Entraron reports.js:69');

    // Generar la data a guardar
    const { ...data } = req.body;

    data.hours = Number(data.hours);
    data.user = req.user._id + '';

    if (data.activity === null || typeof (data.activity) !== 'string') {
        console.log({ error: 'No hay ID o no es un String' });
        return res.status(400).json({ error: 'No es posible cargar la actividad' });
    }

    if (!data.activity.match(/^[0-9a-fA-F]{24}$/)) {
        console.log({ error: 'No es un ID válido de Mongo' });
        return res.status(400).json({ error: 'No es un ID válido de Mongo' });
    }

    // Crear reporte de la actividad
    const report = new Report(data);

    // Buscar actividad como tal en la BD
    const activity = await Activity.findById(data.activity);

    // Ver si la actividad es una célula o no
    if (activity.celula !== null || activity.celula !== undefined) {

        const actividades = (await Activity.find({ celula: activity.celula })).filter((a) => a.name !== activity.name);

        for (let i = 0; i < actividades.length; i++) {
            const indexUser = actividades[i].users.findIndex((u) => u.user.toString() === data.user.toString());
            if (indexUser !== -1) {
                actividades[i].users[indexUser].worked_hours += (data.hours / actividades.length);
                actividades[i].worked_hours += (data.hours / actividades.length);
                await actividades[i].save();
            }
        }
    }

    // Actualizar el número de horas trabajadas por el usuario en la actividad
    if (!activity.is_general) {
        const indexUser = activity.users.findIndex(u => u.user == data.user);
        if (indexUser !== -1) {
            activity.users[indexUser].worked_hours += data.hours;
            activity.worked_hours += data.hours;
        }
    }

    // Guardar DB
    await report.save();
    await activity.save();

    res.status(201).json(report);

}

/**
 * Obtiene todos los registros del time report del usuario logueado
 * @param {*} req 
 * @param {*} res
 * @returns 
 */
const getAllReports = async (req, res = response) => {


    console.log('Entraron reports.js:130');

    const { _id } = req.user;

    if (!_id)
        return res.status(400).json({ error: 'No existe el usuario solicitado' });

    let {
        start = new Date('2020-11-09'),
        end = new Date('2100-11-09'),
        user_id = _id
    } = req.query;



    // En caso de que no haya usuario al cual buscar
    // se usuará el usuario que envió la request
    if (user_id === '' || user_id === undefined)
        user_id = _id;

    const query = {
        $and: [
            { 'user': user_id },
            { 'state': true },
            { 'date': { $gte: new Date(start), $lt: new Date(end) } }
        ]
    };

    const [total, reports] = await Promise.all([
        Report.countDocuments(query),
        Report.find(query)
            .populate({ path: 'user', select: ['name', 'email'] })
            .populate({
                path: 'activity', select: ['codigo_open', 'name', 'company'],
                populate: {
                    path: 'company', select: ['name', 'code'],
                    populate: {
                        path: 'country', select: ['code', 'name', 'img']
                    }
                }
            })
    ]);

    res.json({
        total,
        reports
    });

    // TODO: Editar o eliminar luego :)
    for (const [key, value] of Object.entries(process.memoryUsage())) {
        console.log(`Memory usage by ${key}, ${Math.round(value / 1024 / 1024 * 100) / 100} Mb`);;
    }
};


/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
const getAllReportsHoursGeneralActivities = async (req = request, res = response) => {


    let {
        start = new Date('2022-01-01'),
        end = new Date('2022-10-31')

    } = req.query;

    const query = {
        $and: [
            { 'state': true },
            { 'date': { $gte: new Date(start), $lt: new Date(end) } }
        ]
    };

    const [total, reports] = await Promise.all([
        Report.countDocuments(query),
        Report.find(query)

            .populate({
                path: 'activity', select: ['activity', 'name', 'category', 'open_state',
                    'initial_date', 'end_date', 'is_general', 'estimated_hours', 'worked_hours'],
                populate: {
                    path: 'category', select: ['code', 'name']
                }
            })

        // .populate({
        //     path: 'user', select: ['area'],
        //     populate: {
        //         path: 'area', select: ['code', 'name', 'country'],
        //         populate: { path: 'country', select: ['name', 'code', 'img'] }
        //     }
        // })
        // .populate({
        //     path: 'user', select: ['name', 'email', 'role'],
        //     populate: {
        //         path: 'role', select: ['code', 'name']
        //     }
        // })
    ]);


    const id_activity = [];
    const name_activity = [];
    const worked_hours = [];
    const category = [];

    const generales = reports.filter((report) => report.activity.is_general);

    const agrupar = generales.forEach((report) => {

        if (!id_activity.includes(report.activity._id)) {
            id_activity.push(report.activity._id);
            name_activity.push(report.activity.name);
            worked_hours.push(report.hours);
            // category.push(report.activity.category.name);

        } else {

            let activity_id = id_activity.indexOf(report.activity._id);
            worked_hours[activity_id] += report.hours;

        }

    });

    const lenght = generales.length;

    res.json({
        lenght,
        id_activity,
        name_activity,
        worked_hours,
        category

    });
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
const getAllReportsDashboard = async (req = request, res = response) => {

    console.log('Entraron report.js:195');

    let {
        start = new Date('2020-11-09'),
        end = new Date('2100-11-09')

    } = req.query;

    const query = {
        $and: [
            { 'state': true },
            { 'date': { $gte: new Date(start), $lt: new Date(end) } }
        ]
    };

    const [total, reports] = await Promise.all([
        Report.countDocuments(query),
        Report.find(query)

            .populate({
                path: 'activity', select: ['activity', 'name', 'company', 'open_state',
                    'initial_date', 'end_date', 'is_general', 'estimated_hours', 'worked_hours'],
                populate: {
                    path: 'company', select: ['code', 'name', 'country'],
                    populate: { path: 'country', select: ['name', 'code', 'img'] }
                }
            })

            .populate({
                path: 'user', select: ['area'],
                populate: {
                    path: 'area', select: ['code', 'name', 'country'],
                    populate: { path: 'country', select: ['name', 'code', 'img'] }
                }
            })
            .populate({
                path: 'user', select: ['name', 'email', 'role'],
                populate: {
                    path: 'role', select: ['code', 'name']
                }
            })
    ]);


    res.json({
        total,
        reports
    });


    
    // TODO: Editar o eliminar luego :)
    for (const [key, value] of Object.entries(process.memoryUsage())) {
        console.log(`Memory usage by ${key}, ${Math.round(value / 1024 / 1024 * 100) / 100} Mb`);;
    }

}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
const createAusentimos = async (req = request, res = response) => {


    try {

        console.log('Entraron reports.js:251');

        const { activity, user, position_user, start, end, detail } = req.body;


        if (activity === null || typeof (activity) !== 'string')
            return res.status(500).json({ error: 'No es posible cargar la actividad' });

        if (!activity.match(/^[0-9a-fA-F]{24}$/))
            return res.status(500).json({ error: 'No es un ID válido de Mongo' });


        // Validar actividad
        const activityAusentismo = await Activity.findById(activity);

        if (!activityAusentismo)
            return res.status(500).json({ error: 'No existe la actividad ingresada' });


        // Validar usuario
        const userAusentismo = await User.findById(user);

        if (!userAusentismo)
            return res.status(500).json({ error: 'No existe el usuario ingresado' });

        if (!userAusentismo.state)
            return res.status(500).json({ error: 'El usuario ya no hace parte de la Vicepresidencia o de la organización' });


        // Validar que se ignoren las fechas que son festivo
        const arrayDates = getDates(new Date(start), new Date(end));

        for (let i = 0; i < arrayDates.length; i++) {

            // Validar si ya hay al menos un reporte guardado en esa fecha 
            const query = {
                $and: [
                    { 'user': userAusentismo },
                    { 'state': true },
                    { 'date': { $gte: new Date(moment(arrayDates[i])), $lt: new Date(moment(arrayDates[i]).add(1, 'day')) } }
                ]
            };
            const findReportByDate = await Report.countDocuments(query);


            if (findReportByDate === 0) {

                const report = new Report({
                    date: arrayDates[i],
                    activity: activityAusentismo,
                    user: userAusentismo,
                    hours: 8,
                    detail: detail
                });

                await report.save();

                activityAusentismo.users[position_user].worked_hours += 8;
                activityAusentismo.worked_hours += 8;

            }
        }

        await activityAusentismo.save();
        res.status(200).json({ msg: 'Ausentismo creado' });

    } catch (error) {

        throw new Error(error);
    }


    // TODO: Editar o eliminar luego :)
    for (const [key, value] of Object.entries(process.memoryUsage())) {
        console.log(`Memory usage by ${key}, ${Math.round(value / 1024 / 1024 * 100) / 100} Mb`);;
    }
}

/**
 * Actualiza un reporte especifico de la base de datos.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateReportById = async (req, res = response) => {

    console.log('reports.js:384');

    const { id } = req.params;
    const { state, user, ...data } = req.body;

    if (data.activity === null || typeof (data.activity) !== 'string')
        return res.status(400).json({ error: 'No es posible cargar la actividad' });

    if (!data.activity.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).json({ error: 'No es un ID válido de Mongo' });


    const query = { $and: [{ '_id': id }, { 'user': req.user._id }, { 'state': true }] };

    const report = await Report.findOne(query);

    const old_activity = await Activity.findById(report.activity);

    const activity = await Activity.findById(data.activity);

    // Si la actividad a editar es diferente
    if (data.old_activity !== data.activity) {

        // Elimina las horas trabajadas por usuario en la actividad anterior
        old_activity.users[data.position_user_old_activity].worked_hours -= data.current_hours;
        old_activity.worked_hours -= data.current_hours;


        // Agrega las horas a la actividad escogida luego de editar el reporte
        activity.users[data.position_user].worked_hours += data.hours;
        activity.worked_hours += data.hours;

        await old_activity.save();
        // await activity.save();

    }

    // Si es la misma actividad a la actual
    else {
        // Actualizar el número de horas trabajadas por el usuario en la actividad

        activity.users[data.position_user].worked_hours -= data.current_hours;
        activity.worked_hours -= data.current_hours;

        activity.users[data.position_user].worked_hours += data.hours;
        activity.worked_hours += data.hours;

    }

    report.activity = activity;
    report.detail = data.detail;
    report.hours = data.hours;
    report.date = data.date;

    await activity.save();
    await report.save();


    res.json(report);
};


/**
 * Actualiza un reporte especifico de la base de datos.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateReportCelulaById = async (req, res = response) => {


    console.log('Entraron reports.js:352');

    const { id } = req.params;
    const { state, user, ...data } = req.body;


    if (data.activity === null || typeof (data.activity) !== 'string') {
        console.log({ error: 'No hay ID o no es un String' });
        return res.status(400).json({ error: 'No es posible cargar la actividad' });
    }

    if (!data.activity.match(/^[0-9a-fA-F]{24}$/)) {
        console.log({ error: 'No es un ID válido de Mongo' });
        return res.status(400).json({ error: 'No es un ID válido de Mongo' });
    }

    const query = { $and: [{ '_id': id }, { 'user': req.user._id }, { 'state': true }] };

    const report = await Report.findOneAndUpdate(query, data, { new: true });

    const activity = await Activity.findById(data.activity);

    if (!activity.is_general) {
        // Actualizar el número de horas trabajadas por el usuario en la actividad
        const indexUser = activity.users.findIndex(u => u.user == user._id.toString());

        if (indexUser !== -1) {

            activity.users[indexUser].worked_hours -= data.current_hours;
            activity.worked_hours -= data.current_hours;

            activity.users[indexUser].worked_hours += data.hours;
            activity.worked_hours += data.hours;

            await Activity.findByIdAndUpdate(data.activity, activity);
        }
    }

    // Ver si la actividad es una célula o no
    if (activity.celula !== null || activity.celula !== undefined) {

        const actividades = (await Activity.find({ celula: activity.celula })).filter((a) => a.name !== activity.name);

        for (let i = 0; i < actividades.length; i++) {

            const indexUser = actividades[i].users.findIndex((u) => u.user.toString() === req.user._id.toString());

            if (indexUser !== -1) {

                actividades[i].users[indexUser].worked_hours -= (data.current_hours / actividades.length);
                actividades[i].worked_hours -= (data.current_hours / actividades.length);

                actividades[i].users[indexUser].worked_hours += (data.hours / actividades.length);
                actividades[i].worked_hours += (data.hours / actividades.length);

                await actividades[i].save();
            }

        }
    }

    res.json(report);
};

/**
 * Elimina un registro especifico del time report en base de datos (Soft delete).
 * @param {*} req 
 * @param {*} res
 * @returns 
 */
const deleteReportById = async (req, res = response) => {

    const { id } = req.params;

    if (id === null || typeof (id) !== 'string') {
        console.log({ error: 'No hay ID o no es un String' });
        return res.status(400).json({ error: 'No es posible cargar la actividad' });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log({ error: 'No es un ID válido de Mongo' });
        return res.status(400).json({ error: 'No es un ID válido de Mongo' });
    }



    const query = {
        $and: [{ '_id': id }, { 'user': req.user._id }]
    };

    const reportDeleted = await Report.findOneAndUpdate(query, { state: false }, { new: true });

    const queryActivity = { '_id': reportDeleted.activity._id };
    const activity = await Activity.findById(queryActivity);

    // Delete worked hours
    const indexUser = activity.users.findIndex((u) => u.user._id.toString() == req.user._id.toString());
    if (indexUser !== -1) {
        activity.users[indexUser].worked_hours -= reportDeleted.hours;
        activity.worked_hours -= reportDeleted.hours;

        await Activity.findByIdAndUpdate(queryActivity, activity, { new: true });
    }

    res.json(reportDeleted);
};


/**
 * Elimina un registro especifico del time report en base de datos (Soft delete).
 * @param {*} req 
 * @param {*} res
 * @returns 
 */
const deleteReportCelulaById = async (req, res = response) => {

    console.log('Entraron reports.js:469');

    const { id } = req.params;

    if (id === null || typeof (id) !== 'string') {
        console.log({ error: 'No hay ID o no es un String' });
        return res.status(400).json({ error: 'No es posible cargar la actividad' });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log({ error: 'No es un ID válido de Mongo' });
        return res.status(400).json({ error: 'No es un ID válido de Mongo' });
    }

    const query = {
        $and: [{ '_id': id }, { 'user': req.user._id }]
    };

    const reportDeleted = await Report.findOneAndUpdate(query, { state: false }, { new: true });

    const queryActivity = { '_id': reportDeleted.activity._id };
    const activity = await Activity.findById(queryActivity);


    if (!activity.is_general) {

        // Update worked hours
        const indexUser = activity.users.findIndex((u) => u.user._id.toString() == req.user._id.toString());
        if (indexUser !== -1) {
            activity.users[indexUser].worked_hours -= reportDeleted.hours;
            activity.worked_hours -= reportDeleted.hours;
            await Activity.findByIdAndUpdate(queryActivity, activity, { new: true });
        }
    }

    // Ver si la actividad es una célula o no
    if (activity.celula !== null || activity.celula !== undefined) {

        const actividades = (await Activity.find({ celula: activity.celula })).filter((a) => a.name !== activity.name);

        for (let i = 0; i < actividades.length; i++) {
            const indexUser = actividades[i].users.findIndex((u) => u.user.toString() === req.user._id.toString());
            if (indexUser !== -1) {
                actividades[i].users[indexUser].worked_hours -= (reportDeleted.hours / actividades.length);
                actividades[i].worked_hours -= (reportDeleted.hours / actividades.length);
                await actividades[i].save();
            }
        }
    }

    res.json(reportDeleted);
};


/**
 * Elimina varios registros de forma masiva
 * @param {*} req 
 * @param {*} res 
 */
const deleteMassiveReports = async (req = request, res = response) => {

    const { data = [] } = req.body;

    if (data.length === 0)
        res.status(400).json({ error: 'Debe enviar al menos un reporte a eliminar' });

    for (let i = 0; i < data.length; i++) {

        const query = {
            $and: [{ '_id': data[i].id }, { 'user': data[i].user._id }]
        };

        // Elimina el reporte como tal (poner estado en false)
        const reportDeleted = await Report.findOneAndUpdate(query, { state: false }, { new: true });

        // Busca la actividad
        const queryActivity = { '_id': reportDeleted.activity._id };
        const activity = await Activity.findOne(queryActivity);

        // Comprueba si es una actividad especifíca y no general

        // Update worked hours per user and activity
        const indexUser = activity.users.findIndex(u => u.user._id.toString() == data[i].user._id.toString());
        if (indexUser !== -1) {

            // Actualiza las horas eliminadas del usuario en la actividad
            activity.users[indexUser].worked_hours -= reportDeleted.hours;

            // Actualiza las horas eliminadas de la actividad
            activity.worked_hours -= reportDeleted.hours;

            // Actualiza la actividad como tal
            await Activity.findOneAndUpdate(queryActivity, activity, { new: true });
        }

    }

    res.status(200).json({ msg: 'Reportes eliminados' });
}


const deleteAllHiddenReportsByUser = async (req = request, res = response) => {


    const { data = [] } = req.body;

    if (data.length === 0)
        res.status(401).json({ error: 'No hay data' });

    let allReports = 0

    for (let i = 0; i < data.length; i++) {

        const user = await User.findOne({ email: data[i].email });

        const query = {
            $and: [{ 'user': user }]
        };

        // Elimina el reporte como tal
        const [total, reports] = await Promise.all([
            Report.countDocuments(query),
            // Report.deleteMany(query)
        ]);

        allReports += total;

        // console.log(`${user.email}: `, total);
    }

    // console.log('USERS: ', data.length);
    // console.log('ALL REPORTS: ', allReports);

    res.json({ ok: 'OK papá' });

}

const clearDeletedReports = async (req = request, res = response) => {


    // Elimina el reporte como tal
    const [total, reports] = await Promise.all([
        Report.countDocuments({ state: false }),
        Report.deleteMany({ state: false })
    ]);

    res.status(200).json({ total });

}

/**
 * Obtiene todas las actividades asignadas a un usuario.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getAllActivitiesFromUser = async (req, res = response) => {

    console.log('Entraron reports.js:623');

    const activities = req.user.activities;

    res.json(activities);
};


const setHolidaysOtrosPaises = async (req = request, res = response) => {

    const { year, role, area } = req.body;

    if (!area || !role || !year)
        res.status(500).json({ error: 'Hacen falta datos en la request body' });

    const role_user = await Role.findOne({ code: role });
    const area_user = await Area.findOne({ code: area });

    // Actividad de día festivo
    const dia_festivo = await Activity.findById('62e60db9a1036e0004686e02');

    const [total, users] = await Promise.all([

        User.countDocuments({ role: role_user, area: area_user, state: true }),
        User.find({ role: role_user, area: area_user, state: true })
    ]);

    let holidays = ['19/09/2022', '05/12/2022']

    for (let i = 0; i < users.length; i++) {

        for (let j = 0; j < holidays.length; j++) {

            const date_moment = moment(holidays[j], 'DD/MM/YYYY').format('MM-DD-YYYY');
            const date = new Date(date_moment);

            if (date.getDay() % 6 !== 0) {

                const report = new Report({
                    hours: 8,
                    activity: dia_festivo,
                    user: users[i],
                    date: date,
                    detail: `Día Festivo`
                });

                await report.save();
            }
        }
    }

    res.status(200).json({ total, msg: users });

}


const setHolidaysNewColombia = async (req = request, res = response) => {

    const { year } = req.body;

    if (!year)
        res.status(401).json({ error: 'No se encuentra el campo year' })

    // if (typeof (year) !== Number)
    // res.status(401).json({ error: 'Se espera un valor numero entero' })


    // Actividad de día festivo
    // const dia_festivo = await Activity.find({ codigo_open: 'ACT_0040' });
    const dia_festivo = await Activity.findById('63d04bb913ea0b49c80b6431');

    if (!dia_festivo)
        res.status(401).json({ error: 'No se encuentra el Día Festivo' });


    dia_festivo.estimated_hours = 0;
    dia_festivo.worked_hours = 0;

    for (let i = 0; i < dia_festivo.users.length; i++) {

        dia_festivo.users[i].estimated_hours = 0;
        dia_festivo.users[i].worked_hours = 0;

    }


    let holidays = fc.getHolidaysByYear(year);


    for (let j = 0; j < holidays.length; j++) {

        for (let i = 0; i < dia_festivo.users.length; i++) {

            const user = await User.findById(dia_festivo.users[i].user);

            if (user.email.endsWith("davivienda.com")) {

                const date_moment = moment(holidays[j].date, 'DD/MM/YYYY').format('MM-DD-YYYY');
                const date = new Date(date_moment);

                if (date.getDay() % 6 !== 0) {

                    const report = new Report({
                        hours: 8,
                        activity: dia_festivo,
                        user,
                        date: date,
                        detail: `Día Festivo - ${holidays[j].name}`
                    });

                    // reports.push(report);
                    await report.save();

                    dia_festivo.worked_hours += report.hours;
                    dia_festivo.estimated_hours += report.hours;

                    dia_festivo.users[i].worked_hours += report.hours;
                    dia_festivo.users[i].estimated_hours += report.hours;
                }
            }
        }
    }


    await dia_festivo.save();

    res.status(200).json({ msg: 'Festivos en Colombia cargados completamente', dia_festivo });

}


const setHolidays = async (req = request, res = response) => {


    const { year, role, area } = req.body;

    if (!area || !role || !year)
        res.status(500).json({ error: 'Hacen falta datos en la request body' });


    const role_user = await Role.findOne({ code: role });
    const area_user = await Area.findOne({ code: area });

    // Actividad de día festivo
    const dia_festivo = await Activity.findById('62e60db9a1036e0004686e02');

    const [total, users] = await Promise.all([

        User.countDocuments({ role: role_user, area: area_user, state: true }),
        User.find({ role: role_user, area: area_user, state: true })
    ])

    let holidays = fc.getHolidaysByYear(year);


    for (let i = 0; i < users.length; i++) {

        for (let j = 0; j < holidays.length; j++) {

            const date_moment = moment(holidays[j].date, 'DD/MM/YYYY').format('MM-DD-YYYY');
            const date = new Date(date_moment);

            if (date.getDay() % 6 !== 0) {

                const report = new Report({
                    hours: 8,
                    activity: dia_festivo,
                    user: users[i],
                    date: date,
                    detail: `Día Festivo - ${holidays[j].name}`
                });

                await report.save();
            }

        }

    }

    res.status(200).json({ total, msg: users });

}


const deleteHolidaysTemp = async (req = request, res = response) => {


    // TODO: Actividad de día festivo ANTIGUO
    const dia_festivo = await Activity.findById('63d04bb913ea0b49c80b6431');

    const report = await Report
        .findOneAndDelete({ activity: dia_festivo, date: { "$gte": new Date('2023-01-01') } })
        .deleteMany();

    res.status(200).json({ msg: report.length });

}



const editVacactionsToTheNewActivity = async (req = request, res = response) => {


    // Old vacaciones
    const old_vacation = await Activity.findById('61e1be2edac8cb0004edc942');

    // New vacaciones
    const new_vacation = await Activity.findById('63c6ee47594db53dac4239b5');


    const query = {
        $and: [
            { 'state': true },
            { 'activity': old_vacation },
            { 'date': { $gte: new Date('2022-12-31') } }
        ]
    };

    const [total, reports] = await Promise.all([
        Report.countDocuments(query),
        Report.find(query)
    ]);


    for (let i = 0; i < total; i++) {

        const index = new_vacation.users.findIndex((u) => u.user.toString() == reports[i].user.toString());
        if (index !== -1) {

            reports[i].activity = new_vacation;
            new_vacation.users[index].worked_hours += reports[i].hours;
            new_vacation.worked_hours += reports[i].hours;

        }

        prueba.push(reports[i]);
        // TODO: para cuando se tengan las vacaciones de centro america
        // await reports[i].save();

    }


    // TODO: para cuando se tengan las vacaciones de centro america
    // await new_vacation.save();
    res.status(200).json({ msg: 'OK' });


    // {activity: ObjectId('626d7634df29c30004ebb1d2'), date: {$gte: new Date('2023-01-01')}, state: true}

}

const editBirthdayToTheNewActivity = async (req = request, res = response) => {


    // Old vacaciones
    const old_birthday = await Activity.findById('626d7634df29c30004ebb1d2');

    // New vacaciones
    const new_birthday = await Activity.findById('63c6ee46594db53dac4239a3');


    const query = {
        $and: [
            { 'state': true },
            { 'activity': old_birthday },
            { 'date': { $gte: new Date('2022-12-31') } }
        ]
    };

    const [total, reports] = await Promise.all([
        Report.countDocuments(query),
        Report.find(query)
    ]);



    const prueba = [];

    for (let i = 0; i < total; i++) {

        const index = new_birthday.users.findIndex((u) => u.user.toString() == reports[i].user.toString());
        if (index !== -1) {

            reports[i].activity = new_birthday;
            new_birthday.users[index].worked_hours += reports[i].hours;
            new_birthday.worked_hours += reports[i].hours;

            await reports[i].save();
        }

        // prueba.push(reports[i]);
        // TODO: para cuando se tengan las vacaciones de centro america

    }

    // console.log(prueba.length);

    // TODO: para cuando se tengan las vacaciones de centro america
    await new_birthday.save();
    res.status(200).json({ msg: 'OK' });


    // {activity: ObjectId('626d7634df29c30004ebb1d2'), date: {$gte: new Date('2023-01-01')}, state: true}

}



const getReportsWithOldActivities = async (req = request, res = response) => {

    const [total_old, old_activities] = await Promise.all([
        Activity.countDocuments({ state: false }),
        Activity.find({ state: false })
    ]);

    const reports_to_update = [];


    for (let i = 0; i < total_old; i++) {

        const query = {
            $and: [
                { 'state': true },
                { 'activity': old_activities[i] },
                { 'date': { $gte: new Date('2022-12-31') } }
            ]
        };


        const report = await Report.find(query);

        reports_to_update.push(report);
    }

    console.log(reports_to_update.length);

    res.status(200).json({ msg: 'Se hizo' });

}






function getDates(startDate = new Date(), stopDate = new Date()) {

    var dateArray = new Array();
    var currentDate = startDate;

    while (currentDate <= stopDate) {

        if (new Date(currentDate).getDay() % 6 !== 0)
            dateArray.push(new Date(currentDate));

        currentDate = moment(currentDate).add(1, 'days');
    }

    return dateArray;
}







module.exports = {
    createReport,
    createReportCelula,
    getAllReports,
    updateReportById,
    updateReportCelulaById,
    deleteReportById,
    deleteReportCelulaById,
    deleteMassiveReports,
    getAllActivitiesFromUser,
    createAusentimos,
    setHolidays,
    setHolidaysNewColombia,
    setHolidaysOtrosPaises,
    getAllReportsHoursGeneralActivities,
    getAllReportsDashboard,
    deleteHolidaysTemp,

    editVacactionsToTheNewActivity,
    editBirthdayToTheNewActivity,
    getReportsWithOldActivities
};
