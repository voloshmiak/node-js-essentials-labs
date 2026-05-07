class ApiController {
    constructor({ queueService, queueRepository, userRepository }) {
        this.queueService = queueService;
        this.queueRepository = queueRepository;
        this.userRepository = userRepository;
    }

    getActingUserId(req) {
        return req.headers['x-user-id'] || null;
    }

    handleError(res, error) {
        const msg = error.message || '';
        if (msg.includes('не знайдено') || msg.includes('немає у черзі'))
            return res.status(404).json({ error: msg });
        if (msg.includes('хазяїн') || msg.includes('лише'))
            return res.status(403).json({ error: msg });
        if (msg.includes('вже у'))
            return res.status(409).json({ error: msg });
        if (msg.includes('порожньою'))
            return res.status(400).json({ error: msg });
        console.error('API error:', error);
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }

    async listQueues(req, res) {
        try {
            const { isOpen, ownerUserId, page, limit } = req.query;
            const options = {};
            if (isOpen !== undefined) options.isOpen = isOpen;
            if (ownerUserId) options.ownerUserId = ownerUserId;
            if (page) options.page = page;
            if (limit) options.limit = limit;

            const result = await this.queueRepository.getPage(options);
            const totalPages = Math.ceil(result.total / result.limit);
            res.json({
                data: result.data,
                meta: { total: result.total, page: result.page, limit: result.limit, totalPages }
            });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async createQueue(req, res) {
        try {
            const { title } = req.body;
            if (!title) return res.status(400).json({ error: 'Назва черги є обов\'язковою' });
            const actorId = this.getActingUserId(req);
            const queue = await this.queueService.createQueue(title, actorId);
            res.status(201).json({ data: queue });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async getQueue(req, res) {
        try {
            const { queueId } = req.params;
            const actorId = this.getActingUserId(req);
            const model = await this.queueService.getQueuePageModel(queueId, actorId);
            res.json({
                data: {
                    ...model.queue,
                    entries: model.entries,
                    totalPeople: model.totalPeople
                }
            });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async updateQueue(req, res) {
        try {
            const { queueId } = req.params;
            const { title } = req.body;
            if (!title) return res.status(400).json({ error: 'Назва черги є обов\'язковою' });
            const actorId = this.getActingUserId(req);
            const queue = await this.queueService.updateQueueTitle(queueId, title, actorId);
            res.json({ data: queue });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async deleteQueue(req, res) {
        try {
            const { queueId } = req.params;
            const actorId = this.getActingUserId(req);
            await this.queueService.deleteQueue(queueId, actorId);
            res.json({ data: { id: queueId, deleted: true } });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async openQueue(req, res) {
        try {
            const { queueId } = req.params;
            const actorId = this.getActingUserId(req);
            const queue = await this.queueService.openQueue(queueId, actorId);
            res.json({ data: { id: queue.id, isOpen: queue.isOpen } });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async closeQueue(req, res) {
        try {
            const { queueId } = req.params;
            const actorId = this.getActingUserId(req);
            const queue = await this.queueService.closeQueue(queueId, actorId);
            res.json({ data: { id: queue.id, isOpen: queue.isOpen } });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async callNext(req, res) {
        try {
            const { queueId } = req.params;
            const actorId = this.getActingUserId(req);
            const entry = await this.queueService.callNext(queueId, actorId);
            if (!entry) return res.json({ data: { calledUser: null, message: 'Черга порожня' } });
            res.json({ data: { calledUser: entry } });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async joinQueue(req, res) {
        try {
            const { queueId } = req.params;
            const actorId = this.getActingUserId(req);
            const entry = await this.queueService.joinQueue(queueId, actorId);
            res.status(201).json({ data: entry });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async leaveQueue(req, res) {
        try {
            const { queueId } = req.params;
            const actorId = this.getActingUserId(req);
            await this.queueService.leaveQueue(queueId, actorId);
            res.json({ data: { message: 'Ви успішно вийшли з черги' } });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async removeUserFromQueue(req, res) {
        try {
            const { queueId, userId: targetUserId } = req.params;
            const actorId = this.getActingUserId(req);
            await this.queueService.removeUser(queueId, actorId, targetUserId);
            res.json({ data: { message: 'Користувача видалено з черги', removedUserId: targetUserId } });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async listUsers(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await this.userRepository.getPage({ page, limit });
            const totalPages = Math.ceil(result.total / result.limit);
            res.json({
                data: result.data,
                meta: { total: result.total, page: result.page, limit: result.limit, totalPages }
            });
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async getUser(req, res) {
        try {
            const { userId } = req.params;
            const user = await this.userRepository.getById(userId);
            if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
            res.json({ data: user });
        } catch (err) {
            this.handleError(res, err);
        }
    }
}

module.exports = ApiController;
