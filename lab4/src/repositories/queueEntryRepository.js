const pool = require('../db');

class QueueEntryRepository {
    async getByQueueId(queueId) {
        const [rows] = await pool.execute(
            'SELECT * FROM queue_entries WHERE queueId = ? ORDER BY queueNumber ASC, joinedAt ASC',
            [queueId]
        );
        return rows;
    }

    async findByQueueAndUserId(queueId, userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM queue_entries WHERE queueId = ? AND userId = ? LIMIT 1',
            [queueId, userId]
        );
        return rows[0] || null;
    }

    async create(entry) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const mysqlDate = new Date(entry.joinedAt).toISOString().slice(0, 19).replace('T', ' ');

            await connection.execute(
                'INSERT INTO queue_entries (id, queueId, userId, queueNumber, joinedAt) VALUES (?, ?, ?, ?, ?)',[entry.id, entry.queueId, entry.userId, entry.queueNumber, mysqlDate]
            );
            await connection.commit();
            return entry;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getNextQueueNumber(queueId) {
        const [rows] = await pool.execute(
            'SELECT MAX(queueNumber) as maxNum FROM queue_entries WHERE queueId = ?',
            [queueId]
        );
        const currentMax = rows[0].maxNum;
        return currentMax !== null ? currentMax + 1 : 1;
    }


    async dequeueFirst(queueId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();


            const[rows] = await connection.execute(
                'SELECT * FROM queue_entries WHERE queueId = ? ORDER BY queueNumber ASC, joinedAt ASC LIMIT 1 FOR UPDATE',
                [queueId]
            );

            if (!rows.length) {
                await connection.rollback();
                return null;
            }

            const firstEntry = rows[0];


            await connection.execute('DELETE FROM queue_entries WHERE id = ?', [firstEntry.id]);


            // throw new Error("Помилка в бд");


            await connection.commit();
            return firstEntry;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async removeByQueueAndUserId(queueId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const entry = await this.findByQueueAndUserId(queueId, userId);

            if (!entry) {
                await connection.rollback();
                return null;
            }

            await connection.execute('DELETE FROM queue_entries WHERE id = ?', [entry.id]);
            await connection.commit();
            return entry;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = QueueEntryRepository;