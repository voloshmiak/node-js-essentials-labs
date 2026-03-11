class UserRepository {
    constructor(store) {
        this.store = store;
    }

    async getAll() {
        return [...this.store.users];
    }

    async getById(userId) {
        return this.store.users.find((user) => user.id === userId) || null;
    }

    async getFirst() {
        return this.store.users[0] || null;
    }
}

module.exports = UserRepository;