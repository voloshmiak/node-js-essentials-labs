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

    async getPage(options = {}) {
        const limit = Math.min(parseInt(options.limit) || 10, 50);
        const page = Math.max(parseInt(options.page) || 1, 1);
        const { rows, count } = await User.findAndCountAll({
            limit,
            offset: (page - 1) * limit,
            raw: true
        });
        return { data: rows, total: count, page, limit };
    }
}
module.exports = UserRepository;