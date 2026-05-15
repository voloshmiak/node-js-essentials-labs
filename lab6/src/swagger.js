const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Електронна черга — API',
        version: '1.0.0',
        description: 'REST API для управління електронними чергами (Лабораторна робота №6)',
    },
    servers: [{ url: '/api' }],
    components: {
        parameters: {
            queueId: {
                name: 'queueId',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                example: 'q-uuid'
            },
            userId: {
                name: 'userId',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                example: 'u-1'
            },
            xUserId: {
                name: 'X-User-Id',
                in: 'header',
                required: false,
                schema: { type: 'string' },
                description: 'ID користувача, що виконує дію',
                example: 'u-1'
            }
        },
        schemas: {
            Queue: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'q-uuid' },
                    title: { type: 'string', example: 'Черга підтримки' },
                    isOpen: { type: 'boolean', example: true },
                    ownerUserId: { type: 'string', example: 'u-1' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            QueueEntry: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'e-uuid' },
                    queueId: { type: 'string', example: 'q-uuid' },
                    userId: { type: 'string', example: 'u-2' },
                    queueNumber: { type: 'integer', example: 1 },
                    position: { type: 'integer', example: 1 },
                    joinedAt: { type: 'string', format: 'date-time' }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'u-1' },
                    name: { type: 'string', example: 'Аліса' }
                }
            },
            PaginationMeta: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 42 },
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    totalPages: { type: 'integer', example: 5 }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string', example: 'Чергу не знайдено' }
                }
            }
        }
    },
    paths: {
        '/queues': {
            get: {
                summary: 'Список черг',
                tags: ['Черги'],
                parameters: [
                    { $ref: '#/components/parameters/xUserId' },
                    { name: 'isOpen', in: 'query', schema: { type: 'boolean' }, description: 'Фільтр по статусу' },
                    { name: 'ownerUserId', in: 'query', schema: { type: 'string' }, description: 'Фільтр по власнику' },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } }
                ],
                responses: {
                    200: {
                        description: 'Успішно',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Queue' } },
                                        meta: { $ref: '#/components/schemas/PaginationMeta' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Створити чергу',
                tags: ['Черги'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title'],
                                properties: { title: { type: 'string', example: 'Нова черга' } }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Створено', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Queue' } } } } } },
                    400: { description: 'Відсутня назва', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/queues/{queueId}': {
            get: {
                summary: 'Отримати чергу',
                tags: ['Черги'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                responses: {
                    200: {
                        description: 'Успішно',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            allOf: [
                                                { $ref: '#/components/schemas/Queue' },
                                                { type: 'object', properties: { entries: { type: 'array', items: { $ref: '#/components/schemas/QueueEntry' } }, totalPeople: { type: 'integer' } } }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Не знайдено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            patch: {
                summary: 'Оновити назву черги',
                tags: ['Черги'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', required: ['title'], properties: { title: { type: 'string', example: 'Нова назва' } } } } }
                },
                responses: {
                    200: { description: 'Оновлено', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Queue' } } } } } },
                    400: { description: 'Відсутня назва', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    403: { description: 'Не власник', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    404: { description: 'Не знайдено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            },
            delete: {
                summary: 'Видалити чергу',
                tags: ['Черги'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                responses: {
                    200: { description: 'Видалено', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { id: { type: 'string' }, deleted: { type: 'boolean' } } } } } } } },
                    403: { description: 'Не власник', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    404: { description: 'Не знайдено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/queues/{queueId}/open': {
            post: {
                summary: 'Відкрити чергу',
                tags: ['Дії з чергою'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                responses: {
                    200: { description: 'Відкрито', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { id: { type: 'string' }, isOpen: { type: 'boolean', example: true } } } } } } } },
                    403: { description: 'Не власник', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/queues/{queueId}/close': {
            post: {
                summary: 'Закрити чергу',
                tags: ['Дії з чергою'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                responses: {
                    200: { description: 'Закрито', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { id: { type: 'string' }, isOpen: { type: 'boolean', example: false } } } } } } } },
                    403: { description: 'Не власник', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/queues/{queueId}/next': {
            post: {
                summary: 'Викликати наступного',
                tags: ['Дії з чергою'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                responses: {
                    200: {
                        description: 'Успішно (calledUser = null якщо черга порожня)',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                calledUser: { nullable: true, allOf: [{ $ref: '#/components/schemas/QueueEntry' }] },
                                                message: { type: 'string', example: 'Черга порожня' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: 'Не власник', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/queues/{queueId}/join': {
            post: {
                summary: 'Стати у чергу',
                tags: ['Дії з чергою'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                responses: {
                    201: { description: 'Записано', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/QueueEntry' } } } } } },
                    404: { description: 'Черга не знайдена або закрита', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    409: { description: 'Вже у черзі', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/queues/{queueId}/leave': {
            delete: {
                summary: 'Вийти з черги',
                tags: ['Дії з чергою'],
                parameters: [{ $ref: '#/components/parameters/xUserId' }, { $ref: '#/components/parameters/queueId' }],
                responses: {
                    200: { description: 'Вийшов', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { message: { type: 'string' } } } } } } } },
                    404: { description: 'Не у черзі', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/queues/{queueId}/entries/{userId}': {
            delete: {
                summary: 'Видалити користувача з черги (власник)',
                tags: ['Дії з чергою'],
                parameters: [
                    { $ref: '#/components/parameters/xUserId' },
                    { $ref: '#/components/parameters/queueId' },
                    { $ref: '#/components/parameters/userId' }
                ],
                responses: {
                    200: { description: 'Видалено', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { message: { type: 'string' }, removedUserId: { type: 'string' } } } } } } } },
                    403: { description: 'Не власник', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    404: { description: 'Користувача немає у черзі', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        },
        '/users': {
            get: {
                summary: 'Список користувачів',
                tags: ['Користувачі'],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } }
                ],
                responses: {
                    200: {
                        description: 'Успішно',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                                        meta: { $ref: '#/components/schemas/PaginationMeta' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/users/{userId}': {
            get: {
                summary: 'Отримати користувача',
                tags: ['Користувачі'],
                parameters: [{ $ref: '#/components/parameters/userId' }],
                responses: {
                    200: { description: 'Успішно', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } } } } },
                    404: { description: 'Не знайдено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                }
            }
        }
    }
};

module.exports = swaggerSpec;