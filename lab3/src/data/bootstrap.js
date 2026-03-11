const path = require('path');
const {
    loadJsonSync,
    loadJsonCallback,
    loadJsonPromise,
    loadJsonAsyncAwait
} = require('./loaders/fileLoaders');

async function bootstrapData() {
    const dataDir = path.join(__dirname, '../../data');

    // 1. Синхронний ввід-вивід
    const users = loadJsonSync(path.join(dataDir, 'users.sync.json'));

    // 2. Асинхронний ввід-вивід через callback
    const queues = await loadJsonCallback(path.join(dataDir, 'queues.callback.json'));

    // 3. Асинхронний ввід-вивід через Promise
    const entries = await loadJsonPromise(path.join(dataDir, 'entries.promise.json'));

    // 4. Асинхронний ввід-вивід через async/await
    const settings = await loadJsonAsyncAwait(path.join(dataDir, 'settings.async.json'));

    return {
        users,
        queues,
        entries,
        settings
    };
}

module.exports = bootstrapData;