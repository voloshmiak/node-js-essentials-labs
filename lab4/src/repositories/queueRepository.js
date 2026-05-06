const pool = require('../db');

class QueueRepository {
    async getAll() {

        const [rows] = await pool.execute('SELECT * FROM queues ORDER BY createdAt DESC');
        return rows.map(r => ({ ...r, isOpen: !!r.isOpen }));
    }

    async getById(queueId) {
        const [rows] = await pool.execute('SELECT * FROM queues WHERE id = ?', [queueId]);
        if (!rows.length) return null;
        rows[0].isOpen = !!rows[0].isOpen;
        return rows[0];
    }

    async create(queue) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();


            const mysqlDate = new Date(queue.createdAt).toISOString().slice(0, 19).replace('T', ' ');

            await connection.execute(
                'INSERT INTO queues (id, title, ownerUserId, isOpen, createdAt) VALUES (?, ?, ?, ?, ?)',[queue.id, queue.title, queue.ownerUserId, queue.isOpen, mysqlDate]
            );

            await connection.commit();
            return queue;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async close(queueId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('UPDATE queues SET isOpen = false WHERE id = ?',[queueId]);
            await connection.commit();
            return this.getById(queueId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async open(queueId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('UPDATE queues SET isOpen = true WHERE id = ?', [queueId]);
            await connection.commit();
            return this.getById(queueId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = QueueRepository;