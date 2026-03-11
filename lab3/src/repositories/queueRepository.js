class QueueRepository {
    constructor(store) {
        this.store = store;
    }

    async getAll() {
        return [...this.store.queues].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    async getById(queueId) {
        return this.store.queues.find((queue) => queue.id === queueId) || null;
    }

    async create(queue) {
        this.store.queues.unshift(queue);
        return queue;
    }

    async close(queueId) {
        const queue = await this.getById(queueId);

        if (!queue) {
            return null;
        }

        queue.isOpen = false;
        return queue;
    }

    async open(queueId) {
        const queue = await this.getById(queueId);

        if (!queue) {
            return null;
        }

        queue.isOpen = true;
        return queue;
    }
}

module.exports = QueueRepository;