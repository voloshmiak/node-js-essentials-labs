const { Queue, QueueEntry } = require('../db');

class QueueRepository {
    async getAll() {
        return await Queue.findAll({ order: [['createdAt', 'DESC']], raw: true });
    }

    async getById(queueId, transaction = null) {
        return await Queue.findByPk(queueId, { transaction, raw: true });
    }

    async create(queue, transaction = null) {
        const newQueue = await Queue.create(queue, { transaction });
        return newQueue.get({ plain: true });
    }

    async close(queueId, transaction = null) {
        await Queue.update({ isOpen: false }, { where: { id: queueId }, transaction });
        return this.getById(queueId, transaction);
    }

    async open(queueId, transaction = null) {
        await Queue.update({ isOpen: true }, { where: { id: queueId }, transaction });
        return this.getById(queueId, transaction);
    }

    async getPage(options = {}) {
        const where = {};
        if (options.isOpen !== undefined) where.isOpen = options.isOpen === 'true' || options.isOpen === true;
        if (options.ownerUserId) where.ownerUserId = options.ownerUserId;
        const limit = Math.min(parseInt(options.limit) || 10, 50);
        const page = Math.max(parseInt(options.page) || 1, 1);
        const { rows, count } = await Queue.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset: (page - 1) * limit,
            raw: true
        });
        return { data: rows, total: count, page, limit };
    }

    async update(queueId, fields, transaction = null) {
        await Queue.update(fields, { where: { id: queueId }, transaction });
        return this.getById(queueId, transaction);
    }

    async delete(queueId, transaction = null) {
        await QueueEntry.destroy({ where: { queueId }, transaction });
        await Queue.destroy({ where: { id: queueId }, transaction });
    }
}
module.exports = QueueRepository;