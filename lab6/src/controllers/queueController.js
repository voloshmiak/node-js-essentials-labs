class QueueController {
    constructor(queueService) {
        this.queueService = queueService;
    }

    getCurrentUserId(req) {
        return req.query.user || req.body.currentUserId || 'u1';
    }

    buildListUrl(userId, key, value) {
        let url = `/queues?user=${encodeURIComponent(userId)}`;

        if (key && value) {
            url += `&${key}=${encodeURIComponent(value)}`;
        }

        return url;
    }

    buildQueueUrl(queueId, userId, key, value) {
        let url = `/queues/${queueId}?user=${encodeURIComponent(userId)}`;

        if (key && value) {
            url += `&${key}=${encodeURIComponent(value)}`;
        }

        return url;
    }

    redirectHome(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        res.redirect(`/queues?user=${encodeURIComponent(currentUserId)}`);
    }

    async listQueues(req, res) {
        const currentUserId = this.getCurrentUserId(req);

        try {
            const model = await this.queueService.getQueuesPageModel(currentUserId);

            res.render('queues', {
                ...model,
                message: req.query.message || '',
                error: req.query.error || ''
            });
        } catch (error) {
            res.status(500).render('error', {
                pageTitle: 'Помилка',
                currentUser: null,
                message: error.message || 'Не вдалося завантажити список черг'
            });
        }
    }

    async showQueue(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { queueId } = req.params;

        try {
            const model = await this.queueService.getQueuePageModel(queueId, currentUserId);

            res.render('queue-details', {
                ...model,
                message: req.query.message || '',
                error: req.query.error || ''
            });
        } catch (error) {
            res.status(404).render('error', {
                pageTitle: 'Помилка',
                currentUser: null,
                message: error.message || 'Не вдалося відкрити чергу'
            });
        }
    }

    async createQueue(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { title } = req.body;

        try {
            const queue = await this.queueService.createQueue(title, currentUserId);

            res.redirect(
                this.buildQueueUrl(queue.id, currentUserId, 'message', 'Чергу успішно створено')
            );
        } catch (error) {
            res.redirect(
                this.buildListUrl(currentUserId, 'error', error.message || 'Не вдалося створити чергу')
            );
        }
    }

    async joinQueue(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { queueId } = req.params;

        try {
            await this.queueService.joinQueue(queueId, currentUserId);

            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'message', 'Ви успішно зайняли місце')
            );
        } catch (error) {
            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'error', error.message || 'Помилка запису')
            );
        }
    }

    async leaveQueue(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { queueId } = req.params;

        try {
            await this.queueService.leaveQueue(queueId, currentUserId);

            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'message', 'Ви вийшли з черги')
            );
        } catch (error) {
            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'error', error.message || 'Помилка')
            );
        }
    }

    async callNext(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { queueId } = req.params;

        try {
            const removed = await this.queueService.callNext(queueId, currentUserId);
            const message = removed
                ? `Запрошено наступного: ${removed.userName}`
                : 'У черзі поки нікого немає';

            res.redirect(this.buildQueueUrl(queueId, currentUserId, 'message', message));
        } catch (error) {
            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'error', error.message || 'Помилка')
            );
        }
    }

    async removeUser(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { queueId } = req.params;
        const { targetUserId } = req.body;

        try {
            const removed = await this.queueService.removeUser(
                queueId,
                currentUserId,
                targetUserId
            );

            res.redirect(
                this.buildQueueUrl(
                    queueId,
                    currentUserId,
                    'message',
                    `Користувача ${removed.userName} видалено з черги`
                )
            );
        } catch (error) {
            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'error', error.message || 'Помилка')
            );
        }
    }

    async closeQueue(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { queueId } = req.params;

        try {
            await this.queueService.closeQueue(queueId, currentUserId);

            res.redirect(
                this.buildQueueUrl(
                    queueId,
                    currentUserId,
                    'message',
                    'Чергу закрито для подальших записів'
                )
            );
        } catch (error) {
            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'error', error.message || 'Помилка')
            );
        }
    }

    async openQueue(req, res) {
        const currentUserId = this.getCurrentUserId(req);
        const { queueId } = req.params;

        try {
            await this.queueService.openQueue(queueId, currentUserId);

            res.redirect(
                this.buildQueueUrl(
                    queueId,
                    currentUserId,
                    'message',
                    'Чергу знову відкрито для записів'
                )
            );
        } catch (error) {
            res.redirect(
                this.buildQueueUrl(queueId, currentUserId, 'error', error.message || 'Помилка')
            );
        }
    }
}

module.exports = QueueController;