const { response, request } = require('express');
const { populate } = require('../models/activity');
const Activity = require('../models/activity');
const Report = require('../models/report');
const User = require('../models/user');
const Role = require('../models/role.model');
const Country = require('../models/country.model');
const Area = require('../models/area.model');

const fc = require('festivos-colombia');

// import * as moment from 'moment';
const moment = require('moment');

// import moment from 'moment';

/**
 * Crea un nuevo registro en el time report del usuario.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createReport = async (req, res = response) => {

    console.log('Entraron reports.js:20');

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
                path: 'activity', select: ['name', 'company'],
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
};


/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
const getAllReportsHoursGeneralActivities = async(req = request, res = response) => {


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

}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
const createAusentimos = async (req = request, res = response) => {


    try {

        console.log('Entraron reports.js:251');

        const { activity, user, start, end, detail } = req.body;


        if (activity === null || typeof (activity) !== 'string') {
            console.log({ error: 'No hay ID o no es un String' });
            return res.status(400).json({ error: 'No es posible cargar la actividad' });
        }

        if (!activity.match(/^[0-9a-fA-F]{24}$/)) {
            console.log({ error: 'No es un ID válido de Mongo' });
            return res.status(400).json({ error: 'No es un ID válido de Mongo' });
        }

        const activityAusentismo = await Activity.findById(activity);

        const userAusentismo = await User.findById(user);

        const arrayDates = getDates(new Date(start), new Date(end));

        for (let i = 0; i < arrayDates.length; i++) {

            const report = new Report({
                date: arrayDates[i],
                activity: activityAusentismo,
                user: userAusentismo,
                hours: 8,
                detail
            });

            await report.save();
        }

        res.status(200).json({ msg: 'Ausentismo creado' });

    } catch (error) {

        throw new Error(error);
    }
}

/**
 * Actualiza un reporte especifico de la base de datos. - TODO: revisar luego
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateReportById = async (req, res = response) => {

    console.log('Entraron reports.js:301');

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


    if (!activity.is_general) {

        // Update worked hours
        const indexUser = activity.users.findIndex((u) => u.user._id.toString() == req.user._id.toString());
        if (indexUser !== -1) {
            activity.users[indexUser].worked_hours -= reportDeleted.hours;
            activity.worked_hours -= reportDeleted.hours;
            await Activity.findByIdAndUpdate(queryActivity, activity, { new: true });
        }
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


const deleteMassiveReports = async (req = request, res = response) => {

    const { data = [] } = req.body;

    if (data.length === 0)
        res.status(400).json({ error: 'Debe enviar al menos un reporte a eliminar' });

    for (let i = 0; i < data.length; i++) {

        const query = {
            $and: [{ '_id': data[i].id }, { 'user': data[i].user._id }]
        };

        // Elimina el reporte como tal
        const reportDeleted = await Report.findOneAndUpdate(query, { state: false }, { new: true });

        // Busca la actividad
        const queryActivity = { '_id': reportDeleted.activity._id };
        const activity = await Activity.findOne(queryActivity);

        // Comprueba si es una actividad especifíca y no general
        if (!activity.is_general) {

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

            if (date > new Date()) {

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

    }

    res.status(200).json({ total, msg: users });

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
    setHolidaysOtrosPaises,
    getAllReportsHoursGeneralActivities,
    getAllReportsDashboard
};
