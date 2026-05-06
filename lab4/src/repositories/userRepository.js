const pool = require('../db');

class UserRepository {
    async getAll() {
        const [rows] = await pool.execute('SELECT * FROM users');
        return rows;
    }

    async getById(userId) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
        return rows[0] || null;
    }

    async getFirst() {
        const [rows] = await pool.execute('SELECT * FROM users LIMIT 1');
        return rows[0] || null;
    }
}

module.exports = UserRepository;