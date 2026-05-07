const path = require('path');
const express = require('express');

const UserRepository = require('./src/repositories/userRepository');
const QueueRepository = require('./src/repositories/queueRepository');
const QueueEntryRepository = require('./src/repositories/queueEntryRepository');

const QueueService = require('./src/services/queueService');
const QueueController = require('./src/controllers/queueController');
const ApiController = require('./src/controllers/apiController');
const createWebRouter = require('./src/routes/web');
const createApiRouter = require('./src/routes/api');

async function startApplication() {
    const userRepository = new UserRepository();
    const queueRepository = new QueueRepository();
    const queueEntryRepository = new QueueEntryRepository();

    const queueService = new QueueService({
        userRepository,
        queueRepository,
        queueEntryRepository,
        appSettings: { appTitle: 'Електронна черга' }
    });

    const queueController = new QueueController(queueService);
    const apiController = new ApiController({ queueService, queueRepository, userRepository });

    const app = express();
    const PORT = 3000;

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));

    app.locals.appTitle = 'Електронна черга';

    app.use('/api', createApiRouter(apiController));
    app.use('/', createWebRouter(queueController));

    app.use((req, res) => {
        res.status(404).render('error', {
            pageTitle: '404',
            currentUser: null,
            message: 'Сторінку не знайдено'
        });
    });

    app.listen(PORT, () => {
        console.log(`Server started: http://localhost:${PORT}`);
    });
}

startApplication().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});