const { Queue } = require('../db');

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
}
module.exports = QueueRepository;