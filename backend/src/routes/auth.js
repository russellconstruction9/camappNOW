import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/index.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, hourlyRate } = req.body;

        // Validate input
        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, role, hourly_rate)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, name, role, hourly_rate, avatar_url`,
            [email, passwordHash, name, role, hourlyRate || 0]
        );

        const user = result.rows[0];
        const token = generateToken(user.id, user.email);

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                hourlyRate: user.hourly_rate,
                avatarUrl: user.avatar_url,
            },
            token,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user
        const result = await pool.query(
            'SELECT id, email, password_hash, name, role, hourly_rate, avatar_url FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.email);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                hourlyRate: user.hourly_rate,
                avatarUrl: user.avatar_url,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const jwt = (await import('jsonwebtoken')).default;
        const config = (await import('../config/index.js')).default;

        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        const result = await pool.query(
            'SELECT id, email, name, role, hourly_rate, avatar_url FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            hourlyRate: user.hourly_rate,
            avatarUrl: user.avatar_url,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

