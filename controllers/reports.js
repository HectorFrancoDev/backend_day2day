const { response, request } = require('express');
const { populate } = require('../models/activity');
const Activity = require('../models/activity');
const Report = require('../models/report');
const User = require('../models/user');

// import moment from 'moment';

/**
 * Crea un nuevo registro en el time report del usuario.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createReport = async (req, res = response) => {

    // Generar la data a guardar
    const { ...data } = req.body;
    data.hours = Number(data.hours);
    data.user = req.user._id + '';

    const report = new Report(data);

    // Actualizar el número de horas trabajadas por el usuario en la actividad
    const activity = await Activity.findById(data.activity);

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
 * Obtiene todos los registros del time report del usuario logueado
 * @param {*} req 
 * @param {*} res
 * @returns 
 */
const getAllReports = async (req, res = response) => {

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

const getAllReportsDashboard = async (req = request, res = response) => {

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



    // const [total, reports] = await Promise.all([
    //     Report.countDocuments(query),
    //     Report.find(query)

    //         .populate({
    //             path: 'activity', select: ['activity', 'name', 'company', 'open_state',
    //                 'initial_date', 'end_date', 'is_general', 'estimated_hours', 'worked_hours'],
    //             populate: {
    //                 path: 'company', select: ['code', 'name', 'country'],
    //                 populate: { path: 'country', select: ['name', 'code', 'img'] }
    //             }
    //         })

    //         .populate({
    //             path: 'user', select: ['area'],
    //             populate: {
    //                 path: 'area', select: ['code', 'name', 'country'],
    //                 populate: { path: 'country', select: ['name', 'code', 'img'] }
    //             }
    //         })
    //         .populate({
    //             path: 'user', select: ['name', 'email', 'role'],
    //             populate: {
    //                 path: 'role', select: ['code', 'name']
    //             }
    //         })
    // ]);


    res.json({
        // total,
        // reports

        msg: 'RESPONDE CON ALGO'
    });

}


/**
 * Actualiza un reporte especifico de la base de datos.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateReportById = async (req, res = response) => {

    const { id } = req.params;
    const { state, user, ...data } = req.body;

    const query = { $and: [{ '_id': id }, { 'user': req.user._id }, { 'state': true }] };

    const report = await Report.findOneAndUpdate(query, data, { new: true });

    const activity = await Activity.findById(data.activity);

    if (!activity.is_genearl) {
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
 * Elimina un registro especifico del time report en base de datos (Soft delete).
 * @param {*} req 
 * @param {*} res
 * @returns 
 */
const deleteReportById = async (req, res = response) => {

    const { id } = req.params;

    const query = {
        $and:
            [
                { '_id': id },
                { 'user': req.user._id }
            ]
    };

    const reportDeleted = await Report.findOneAndUpdate(query, { state: false }, { new: true });

    const queryActivity = { '_id': reportDeleted.activity._id };
    const activity = await Activity.findOne(queryActivity);

    if (!activity.is_general) {

        // Update worked hours
        const indexUser = activity.users.findIndex(u => u.user._id.toString() == req.user._id.toString());
        if (indexUser !== -1) {
            activity.users[indexUser].worked_hours -= reportDeleted.hours;
            activity.worked_hours -= reportDeleted.hours;
            await Activity.findByIdAndUpdate(queryActivity, activity, { new: true });
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
    const activities = req.user.activities;

    res.json(activities);
};

module.exports = {
    createReport,
    getAllReports,
    updateReportById,
    deleteReportById,
    deleteMassiveReports,
    getAllActivitiesFromUser,

    // deleteAllHiddenReportsByUser
    // clearDeletedReports

    getAllReportsDashboard
};
