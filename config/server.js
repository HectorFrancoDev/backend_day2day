const express = require('express');
const cors = require('cors');

const { dbConnection } = require('./database');

/**
 * Contiene todo lo necesario para ejecutarse el servidor con el servicio.
 */
class Server {
    /**
     * Inicializa la configuración inicial requerida.
     */
    constructor() {
        this.app = express();
        this.port = process.env.PORT;

        // Rutas a los diferentes Endpoints.
        this.paths = {
            auth:       '/api/auth',
            reports:    '/api/reports',
            users:      '/api/users',
            activities: '/api/activities', 
            categories: '/api/categories', 
            countries:  '/api/countries', 
            companies:  '/api/companies',
            roles:      '/api/roles',
            areas:      '/api/areas',
            calendars:  '/api/calendars',
            celulas:    '/api/celulas',
        };

        // Conectar a base de datos
        this.connectDB();

        // Middlewares
        this.middlewares();

        // Rutas de la API
        this.routes();
    }

    async connectDB() {
        await dbConnection();
    }

    

    middlewares() {
        // CORS
        const corsOptions = {
            origin: [
                '*',
                'http://localhost:4200',
                'https://day2day.ml',
                'https://hosting-day-2-day.web.app'
            ],
        }
        this.app.use(cors(corsOptions));

        // Lectura y parseo del body
        this.app.use(express.json({ limit: '100mb' }));
    }

    routes() {
        this.app.use(this.paths.users,      require('../routes/users'));
        this.app.use(this.paths.reports,    require('../routes/reports'));
        this.app.use(this.paths.auth,       require('../routes/auth'));
        this.app.use(this.paths.activities, require('../routes/activities'));
        this.app.use(this.paths.categories, require('../routes/categories.routing'));
        this.app.use(this.paths.countries,  require('../routes/countries.routing'));
        this.app.use(this.paths.companies,  require('../routes/companies.routing'));
        this.app.use(this.paths.roles,      require('../routes/roles.routing'));
        this.app.use(this.paths.areas,      require('../routes/areas.routing'));
        this.app.use(this.paths.calendars,  require('../routes/calendars.routing'));
        this.app.use(this.paths.celulas,    require('../routes/celulas.routing'));
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
        });
        // this.app.listen(this.port);
    }
}

module.exports = Server;
