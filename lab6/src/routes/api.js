const { Router } = require('express');

function createApiRouter(apiController) {
    const router = Router();

    router.get('/queues', (req, res) => apiController.listQueues(req, res));
    router.post('/queues', (req, res) => apiController.createQueue(req, res));
    router.get('/queues/:queueId', (req, res) => apiController.getQueue(req, res));
    router.patch('/queues/:queueId', (req, res) => apiController.updateQueue(req, res));
    router.delete('/queues/:queueId', (req, res) => apiController.deleteQueue(req, res));
    router.post('/queues/:queueId/open', (req, res) => apiController.openQueue(req, res));
    router.post('/queues/:queueId/close', (req, res) => apiController.closeQueue(req, res));
    router.post('/queues/:queueId/next', (req, res) => apiController.callNext(req, res));
    router.post('/queues/:queueId/join', (req, res) => apiController.joinQueue(req, res));
    router.delete('/queues/:queueId/leave', (req, res) => apiController.leaveQueue(req, res));
    router.delete('/queues/:queueId/entries/:userId', (req, res) => apiController.removeUserFromQueue(req, res));

    router.get('/users', (req, res) => apiController.listUsers(req, res));
    router.get('/users/:userId', (req, res) => apiController.getUser(req, res));

    return router;
}

module.exports = createApiRouter;
