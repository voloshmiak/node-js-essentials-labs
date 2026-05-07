const express = require('express');

function createWebRouter(queueController) {
    const router = express.Router();

    router.get('/', queueController.redirectHome.bind(queueController));

    router.get('/queues', queueController.listQueues.bind(queueController));
    router.post('/queues', queueController.createQueue.bind(queueController));

    router.get('/queues/:queueId', queueController.showQueue.bind(queueController));
    router.post('/queues/:queueId/join', queueController.joinQueue.bind(queueController));
    router.post('/queues/:queueId/leave', queueController.leaveQueue.bind(queueController));
    router.post('/queues/:queueId/next', queueController.callNext.bind(queueController));
    router.post('/queues/:queueId/remove', queueController.removeUser.bind(queueController));
    router.post('/queues/:queueId/close', queueController.closeQueue.bind(queueController));
    router.post('/queues/:queueId/open', queueController.openQueue.bind(queueController));

    return router;
}

module.exports = createWebRouter;