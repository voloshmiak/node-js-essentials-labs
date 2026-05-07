const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'lab4_queue',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '123456',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        // logging: false,
    }
);

const User = sequelize.define('User', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'users', timestamps: false });

const Queue = sequelize.define('Queue', {
    id: { type: DataTypes.STRING, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    isOpen: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'isOpen' }
}, { tableName: 'queues', timestamps: true, updatedAt: false });

const QueueEntry = sequelize.define('QueueEntry', {
    id: { type: DataTypes.STRING, primaryKey: true },
    queueNumber: { type: DataTypes.INTEGER, allowNull: false },
    joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'queue_entries', timestamps: false });

User.hasMany(Queue, { foreignKey: 'ownerUserId' });
Queue.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });

Queue.hasMany(QueueEntry, { foreignKey: 'queueId', as: 'entries' });
QueueEntry.belongsTo(Queue, { foreignKey: 'queueId' });

User.hasMany(QueueEntry, { foreignKey: 'userId' });
QueueEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

sequelize.sync().then(() => console.log("БД синхронізована через Sequelize"));

module.exports = { sequelize, User, Queue, QueueEntry };