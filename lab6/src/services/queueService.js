const { randomUUID } = require('crypto');
const { sequelize } = require('../db');

class QueueService {
    constructor({ userRepository, queueRepository, queueEntryRepository }) {
        this.userRepository = userRepository;
        this.queueRepository = queueRepository;
        this.queueEntryRepository = queueEntryRepository;
    }

    async resolveCurrentUser(currentUserId) {
        const user = await this.userRepository.getById(currentUserId);
        return user ? user : await this.userRepository.getFirst();
    }

    buildUsersMap(users) {
        return new Map(users.map(u => [u.id, u]));
    }

    decorateEntry(entry, usersMap, currentUserId, position = null) {
        const user = usersMap.get(entry.userId);
        return {
            ...entry,
            userName: user ? user.name : 'Невідомо',
            position,
            isCurrentUser: currentUserId ? entry.userId === currentUserId : false
        };
    }

    async getQueuesPageModel(currentUserId) {
        const currentUser = await this.resolveCurrentUser(currentUserId);
        const users = await this.userRepository.getAll();
        const usersMap = this.buildUsersMap(users);
        const queues = await this.queueRepository.getAll();

        const queueCards = await Promise.all(queues.map(async (queue) => {
            const owner = usersMap.get(queue.ownerUserId);
            const entries = await this.queueEntryRepository.getByQueueId(queue.id);
            return {
                ...queue,
                ownerName: owner ? owner.name : 'Невідомо',
                totalPeople: entries.length,
                currentUserInside: entries.some(e => e.userId === currentUser.id)
            };
        }));

        return { pageTitle: 'Черги', currentUser, users, queues: queueCards };
    }

    async getQueuePageModel(queueId, currentUserId) {
        const queue = await this.queueRepository.getById(queueId);
        if (!queue) throw new Error('Чергу не знайдено');

        const currentUser = await this.resolveCurrentUser(currentUserId);
        const users = await this.userRepository.getAll();
        const usersMap = this.buildUsersMap(users);
        const owner = usersMap.get(queue.ownerUserId);
        const entries = await this.queueEntryRepository.getByQueueId(queueId);

        const decoratedEntries = entries.map((entry, index) =>
            this.decorateEntry(entry, usersMap, currentUser.id, index + 1)
        );

        const myEntry = decoratedEntries.find(e => e.userId === currentUser.id);

        return {
            pageTitle: queue.title,
            currentUser,
            users,
            queue: { ...queue, ownerName: owner ? owner.name : 'Невідомо' },
            entries: decoratedEntries,
            currentUserPlace: myEntry ? { number: myEntry.position, queueNumber: myEntry.queueNumber } : null,
            canJoin: queue.isOpen && !myEntry,
            canLeave: !!myEntry,
            isOwner: queue.ownerUserId === currentUser.id,
            totalPeople: decoratedEntries.length
        };
    }

    // ТРАНЗАКЦІЙНЕ СТВОРЕННЯ
    async createQueue(title, currentUserId) {
        return await sequelize.transaction(async (t) => {
            const currentUser = await this.resolveCurrentUser(currentUserId);
            if (!title) throw new Error('Назва черги не може бути порожньою');

            const queue = {
                id: `q-${randomUUID()}`,
                title: title.trim(),
                ownerUserId: currentUser.id,
                isOpen: true
            };
            return await this.queueRepository.create(queue, t);
        });
    }

    // ТРАНЗАКЦІЙНИЙ ЗАПИС
    async joinQueue(queueId, currentUserId) {
        return await sequelize.transaction(async (t) => {
            const queue = await this.queueRepository.getById(queueId, t);
            if (!queue || !queue.isOpen) throw new Error('Чергу не знайдено або закрито');

            const currentUser = await this.resolveCurrentUser(currentUserId);
            const existingEntry = await this.queueEntryRepository.findByQueueAndUserId(queueId, currentUser.id, t);
            if (existingEntry) throw new Error('Ви вже у цій черзі');

            const entry = {
                id: `e-${randomUUID()}`,
                queueId,
                userId: currentUser.id,
                queueNumber: await this.queueEntryRepository.getNextQueueNumber(queueId, t)
            };
            return await this.queueEntryRepository.create(entry, t);
        });
    }

    // ТРАНЗАКЦІЙНИЙ ВИХІД
    async leaveQueue(queueId, currentUserId) {
        return await sequelize.transaction(async (t) => {
            const currentUser = await this.resolveCurrentUser(currentUserId);
            const existingEntry = await this.queueEntryRepository.findByQueueAndUserId(queueId, currentUser.id, t);
            if (!existingEntry) throw new Error('Вас немає у черзі');
            
            await this.queueEntryRepository.removeById(existingEntry.id, t);
            return existingEntry;
        });
    }

    // ROLLBACK
    async callNext(queueId, actorId) {
        return await sequelize.transaction(async (t) => {
            const queue = await this.queueRepository.getById(queueId, t);
            if (!queue) throw new Error('Чергу не знайдено');
            await this.assertOwner(queue, actorId);

            const firstEntry = await this.queueEntryRepository.getFirstInQueue(queueId, t);
            if (!firstEntry) return null;

            await this.queueEntryRepository.removeById(firstEntry.id, t);

            // Якщо що рядок нижче, щоб показати відкат транзакції.
            // throw new Error("Імітація помилки системи: транзакція буде відкочена (ROLLBACK), користувач не видалиться!");

            const user = await this.userRepository.getById(firstEntry.userId);
            return { ...firstEntry, userName: user ? user.name : 'Невідомо' };
        });
    }

    async removeUser(queueId, actorId, targetUserId) {
        return await sequelize.transaction(async (t) => {
            const queue = await this.queueRepository.getById(queueId, t);
            await this.assertOwner(queue, actorId);

            const targetEntry = await this.queueEntryRepository.findByQueueAndUserId(queueId, targetUserId, t);
            if (!targetEntry) throw new Error('Користувача немає у черзі');

            await this.queueEntryRepository.removeById(targetEntry.id, t);
            const user = await this.userRepository.getById(targetEntry.userId);
            return { ...targetEntry, userName: user ? user.name : 'Невідомо' };
        });
    }

    async closeQueue(queueId, actorId) {
        return await sequelize.transaction(async (t) => {
            const queue = await this.queueRepository.getById(queueId, t);
            await this.assertOwner(queue, actorId);
            if (!queue.isOpen) return queue;
            return await this.queueRepository.close(queueId, t);
        });
    }

    async openQueue(queueId, actorId) {
        return await sequelize.transaction(async (t) => {
            const queue = await this.queueRepository.getById(queueId, t);
            await this.assertOwner(queue, actorId);
            if (queue.isOpen) return queue;
            return await this.queueRepository.open(queueId, t);
        });
    }

    async updateQueueTitle(queueId, newTitle, actorId) {
        return await sequelize.transaction(async (t) => {
            const queue = await this.queueRepository.getById(queueId, t);
            if (!queue) throw new Error('Чергу не знайдено');
            await this.assertOwner(queue, actorId);
            if (!newTitle || !newTitle.trim()) throw new Error('Назва черги не може бути порожньою');
            return await this.queueRepository.update(queueId, { title: newTitle.trim() }, t);
        });
    }

    async deleteQueue(queueId, actorId) {
        return await sequelize.transaction(async (t) => {
            const queue = await this.queueRepository.getById(queueId, t);
            if (!queue) throw new Error('Чергу не знайдено');
            await this.assertOwner(queue, actorId);
            await this.queueRepository.delete(queueId, t);
        });
    }

    async assertOwner(queue, actorId) {
        const actor = await this.resolveCurrentUser(actorId);
        if (queue.ownerUserId !== actor.id) throw new Error('Лише хазяїн черги може виконати цю дію');
    }
}

module.exports = QueueService;