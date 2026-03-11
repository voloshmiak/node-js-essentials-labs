class QueueEntryRepository {
    constructor(store) {
        this.store = store;
    }

    async getByQueueId(queueId) {
        return this.store.entries
            .filter((entry) => entry.queueId === queueId)
            .sort((a, b) => {
                const aNumber = typeof a.queueNumber === 'number' ? a.queueNumber : Number.MAX_SAFE_INTEGER;
                const bNumber = typeof b.queueNumber === 'number' ? b.queueNumber : Number.MAX_SAFE_INTEGER;

                if (aNumber !== bNumber) {
                    return aNumber - bNumber;
                }

                return new Date(a.joinedAt) - new Date(b.joinedAt);
            });
    }

    async findByQueueAndUserId(queueId, userId) {
        return (
            this.store.entries.find(
                (entry) => entry.queueId === queueId && entry.userId === userId
            ) || null
        );
    }

    async create(entry) {
        this.store.entries.push(entry);
        return entry;
    }

    async getNextQueueNumber(queueId) {
        const entries = await this.getByQueueId(queueId);

        if (!entries.length) {
            return 1;
        }

        const maxNumber = entries.reduce((max, entry, index) => {
            const candidate =
                typeof entry.queueNumber === 'number' ? entry.queueNumber : index + 1;

            return Math.max(max, candidate);
        }, 0);

        return maxNumber + 1;
    }

    async dequeueFirst(queueId) {
        const entries = await this.getByQueueId(queueId);

        if (!entries.length) {
            return null;
        }

        const firstEntryId = entries[0].id;
        const index = this.store.entries.findIndex((entry) => entry.id === firstEntryId);

        if (index === -1) {
            return null;
        }

        return this.store.entries.splice(index, 1)[0];
    }

    async removeByQueueAndUserId(queueId, userId) {
        const index = this.store.entries.findIndex(
            (entry) => entry.queueId === queueId && entry.userId === userId
        );

        if (index === -1) {
            return null;
        }

        return this.store.entries.splice(index, 1)[0];
    }
}

module.exports = QueueEntryRepository;