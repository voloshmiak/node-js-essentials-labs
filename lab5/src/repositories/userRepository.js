const { User } = require('../db');

class UserRepository {
    async getAll() {
        return await User.findAll({ raw: true });
    }

    async getById(userId) {
        return await User.findByPk(userId, { raw: true });
    }

    async getFirst() {
        return await User.findOne({ raw: true });
    }
}
module.exports = UserRepository;