const fs = require('fs');

function loadJsonSync(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
}

function loadJsonCallback(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (error, raw) => {
            if (error) {
                return reject(error);
            }

            try {
                resolve(JSON.parse(raw));
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

function loadJsonPromise(filePath) {
    return fs.promises
        .readFile(filePath, 'utf-8')
        .then((raw) => JSON.parse(raw));
}

async function loadJsonAsyncAwait(filePath) {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
}

module.exports = {
    loadJsonSync,
    loadJsonCallback,
    loadJsonPromise,
    loadJsonAsyncAwait
};