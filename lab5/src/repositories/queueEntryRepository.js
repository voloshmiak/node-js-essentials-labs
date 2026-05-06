const { QueueEntry } = require('../db');

class QueueEntryRepository {
    async getByQueueId(queueId) {
        return await QueueEntry.findAll({
            where: { queueId },
            order: [['queueNumber', 'ASC'], ['joinedAt', 'ASC']],
            raw: true
        });
    }

    async findByQueueAndUserId(queueId, userId, transaction = null) {
        return await QueueEntry.findOne({ where: { queueId, userId }, transaction, raw: true });
    }

    async create(entry, transaction = null) {
        const newEntry = await QueueEntry.create(entry, { transaction });
        return newEntry.get({ plain: true });
    }

    async getNextQueueNumber(queueId, transaction = null) {
        const maxNum = await QueueEntry.max('queueNumber', { where: { queueId }, transaction });
        return maxNum !== null && !isNaN(maxNum) ? maxNum + 1 : 1;
    }

    async getFirstInQueue(queueId, transaction = null) {
        return await QueueEntry.findOne({
            where: { queueId },
            order: [['queueNumber', 'ASC'], ['joinedAt', 'ASC']],
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
            transaction,
            raw: true
        });
    }

    async removeById(id, transaction = null) {
        await QueueEntry.destroy({ where: { id }, transaction });
    }
}
module.exports = QueueEntryRepository;