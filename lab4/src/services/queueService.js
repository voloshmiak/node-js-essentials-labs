const { randomUUID } = require('crypto');

class QueueService {
    constructor({ userRepository, queueRepository, queueEntryRepository, appSettings }) {
        this.userRepository = userRepository;
        this.queueRepository = queueRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.appSettings = appSettings || {};
    }

    async resolveCurrentUser(currentUserId) {
        const requestedUser = await this.userRepository.getById(currentUserId);

        if (requestedUser) {
            return requestedUser;
        }

        return this.userRepository.getFirst();
    }

    buildUsersMap(users) {
        return new Map(users.map((user) => [user.id, user]));
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

        const queueCards = [];

        for (const queue of queues) {
            const owner = usersMap.get(queue.ownerUserId);
            const entries = await this.queueEntryRepository.getByQueueId(queue.id);

            queueCards.push({
                ...queue,
                ownerName: owner ? owner.name : 'Невідомо',
                totalPeople: entries.length,
                currentUserInside: entries.some((entry) => entry.userId === currentUser.id)
            });
        }

        queueCards.sort((a, b) => {
            if (a.isOpen === b.isOpen) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }

            return Number(b.isOpen) - Number(a.isOpen);
        });

        return {
            pageTitle: 'Черги',
            currentUser,
            users,
            queues: queueCards
        };
    }

    async getQueuePageModel(queueId, currentUserId) {
        const queue = await this.queueRepository.getById(queueId);

        if (!queue) {
            throw new Error('Чергу не знайдено');
        }

        const currentUser = await this.resolveCurrentUser(currentUserId);
        const users = await this.userRepository.getAll();
        const usersMap = this.buildUsersMap(users);
        const owner = usersMap.get(queue.ownerUserId);
        const entries = await this.queueEntryRepository.getByQueueId(queueId);

        const decoratedEntries = entries.map((entry, index) =>
            this.decorateEntry(entry, usersMap, currentUser.id, index + 1)
        );

        const myEntry = decoratedEntries.find((entry) => entry.userId === currentUser.id);

        return {
            pageTitle: queue.title,
            currentUser,
            users,
            queue: {
                ...queue,
                ownerName: owner ? owner.name : 'Невідомо'
            },
            entries: decoratedEntries,
            currentUserPlace: myEntry
                ? {
                    number: myEntry.position,
                    peopleAhead: myEntry.position - 1,
                    queueNumber: myEntry.queueNumber
                }
                : null,
            canJoin: queue.isOpen && !myEntry,
            canLeave: !!myEntry,
            isOwner: queue.ownerUserId === currentUser.id,
            totalPeople: decoratedEntries.length
        };
    }

    async createQueue(title, currentUserId) {
        const currentUser = await this.resolveCurrentUser(currentUserId);
        const normalizedTitle = String(title || '').trim();

        if (!normalizedTitle) {
            throw new Error('Назва черги не може бути порожньою');
        }

        const queue = {
            id: `q-${randomUUID()}`,
            title: normalizedTitle,
            ownerUserId: currentUser.id,
            isOpen: true,
            createdAt: new Date().toISOString()
        };

        return this.queueRepository.create(queue);
    }

    async joinQueue(queueId, currentUserId) {
        const queue = await this.queueRepository.getById(queueId);

        if (!queue) {
            throw new Error('Чергу не знайдено');
        }

        if (!queue.isOpen) {
            throw new Error('Черга вже закрита для нових записів');
        }

        const currentUser = await this.resolveCurrentUser(currentUserId);
        const existingEntry = await this.queueEntryRepository.findByQueueAndUserId(
            queueId,
            currentUser.id
        );

        if (existingEntry) {
            throw new Error('Ви вже перебуваєте у цій черзі');
        }

        const nextQueueNumber = await this.queueEntryRepository.getNextQueueNumber(queueId);

        const entry = {
            id: `e-${randomUUID()}`,
            queueId,
            userId: currentUser.id,
            queueNumber: nextQueueNumber,
            joinedAt: new Date().toISOString()
        };

        return this.queueEntryRepository.create(entry);
    }

    async leaveQueue(queueId, currentUserId) {
        const queue = await this.queueRepository.getById(queueId);

        if (!queue) {
            throw new Error('Чергу не знайдено');
        }

        const currentUser = await this.resolveCurrentUser(currentUserId);

        const removedEntry = await this.queueEntryRepository.removeByQueueAndUserId(
            queueId,
            currentUser.id
        );

        if (!removedEntry) {
            throw new Error('Вас немає у цій черзі');
        }

        return removedEntry;
    }

    async callNext(queueId, actorId) {
        const queue = await this.queueRepository.getById(queueId);

        if (!queue) {
            throw new Error('Чергу не знайдено');
        }

        await this.assertOwner(queue, actorId);

        const removedEntry = await this.queueEntryRepository.dequeueFirst(queueId);

        if (!removedEntry) {
            return null;
        }

        const user = await this.userRepository.getById(removedEntry.userId);

        return {
            ...removedEntry,
            userName: user ? user.name : 'Невідомо'
        };
    }

    async removeUser(queueId, actorId, targetUserId) {
        const queue = await this.queueRepository.getById(queueId);

        if (!queue) {
            throw new Error('Чергу не знайдено');
        }

        await this.assertOwner(queue, actorId);

        const removedEntry = await this.queueEntryRepository.removeByQueueAndUserId(
            queueId,
            targetUserId
        );

        if (!removedEntry) {
            throw new Error('Користувача вже немає у черзі');
        }

        const user = await this.userRepository.getById(removedEntry.userId);

        return {
            ...removedEntry,
            userName: user ? user.name : 'Невідомо'
        };
    }

    async closeQueue(queueId, actorId) {
        const queue = await this.queueRepository.getById(queueId);

        if (!queue) {
            throw new Error('Чергу не знайдено');
        }

        await this.assertOwner(queue, actorId);

        if (!queue.isOpen) {
            return queue;
        }

        return this.queueRepository.close(queueId);
    }

    async openQueue(queueId, actorId) {
        const queue = await this.queueRepository.getById(queueId);

        if (!queue) {
            throw new Error('Чергу не знайдено');
        }

        await this.assertOwner(queue, actorId);

        if (queue.isOpen) {
            return queue;
        }

        return this.queueRepository.open(queueId);
    }

    async assertOwner(queue, actorId) {
        const actor = await this.resolveCurrentUser(actorId);

        if (queue.ownerUserId !== actor.id) {
            throw new Error('Лише хазяїн черги може виконати цю дію');
        }
    }
}

module.exports = QueueService;