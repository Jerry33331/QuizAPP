const bcrypt = require('bcrypt');
const { Pool } = require('pg');

class User {
    constructor(pool) {
        this.pool = pool;
    }

    // Create a new user
    async create(username, email, password, role = 'player') {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (username, email, password_hash, role, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, username, email, role, created_at
        `;
        
        const values = [username, email, hashedPassword, role];
        const result = await this.pool.query(query, values);
        
        return result.rows[0];
    }

    // Find user by username
    async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0];
    }

    // Find user by email
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await this.pool.query(query, [email]);
        return result.rows[0];
    }

    // Find user by ID
    async findById(id) {
        const query = 'SELECT id, username, email, role, created_at FROM users WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return result.rows[0];
    }

    // Verify password
    async verifyPassword(user, password) {
        if (!user) return false;
        return await bcrypt.compare(password, user.password_hash);
    }

    // Initialize users table
    async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'player',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        await this.pool.query(query);
    }
}

module.exports = User;
