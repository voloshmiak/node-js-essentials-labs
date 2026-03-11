class DataStore {
    constructor(seedData) {
        this.users = (seedData.users || []).map((item) => ({ ...item }));
        this.queues = (seedData.queues || []).map((item) => ({ ...item }));
        this.entries = (seedData.entries || []).map((item) => ({ ...item }));
        this.settings = { ...(seedData.settings || {}) };
    }
}

module.exports = DataStore;