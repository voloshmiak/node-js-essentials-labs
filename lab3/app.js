const path = require('path');
const express = require('express');

const bootstrapData = require('./src/data/bootstrap');
const DataStore = require('./src/data/dataStore');

const UserRepository = require('./src/repositories/userRepository');
const QueueRepository = require('./src/repositories/queueRepository');
const QueueEntryRepository = require('./src/repositories/queueEntryRepository');

const QueueService = require('./src/services/queueService');
const QueueController = require('./src/controllers/queueController');
const createWebRouter = require('./src/routes/web');

async function startApplication() {
    const seedData = await bootstrapData();
    const store = new DataStore(seedData);

    const userRepository = new UserRepository(store);
    const queueRepository = new QueueRepository(store);
    const queueEntryRepository = new QueueEntryRepository(store);C

    const queueService = new QueueService({
        userRepository,
        queueRepository,
        queueEntryRepository,
        appSettings: seedData.settings
    });

    const queueController = new QueueController(queueService);

    const app = express();
    const PORT = 3000;

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));

    app.locals.appTitle = seedData.settings.appTitle || 'Electronic Queue';

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