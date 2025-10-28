import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/index.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, hourlyRate, organizationId } = req.body;

        // Validate input
        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // If organizationId is not provided, this is a new organization owner
        // If provided, user is joining existing organization
        let orgId = organizationId;
        let isNewOrganization = false;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // If no organization provided, create one
            if (!orgId) {
                isNewOrganization = true;
                const orgName = req.body.organizationName || `${name}'s Organization`;
                
                const orgResult = await client.query(
                    'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
                    [orgName]
                );
                orgId = orgResult.rows[0].id;
            } else {
                // Verify organization exists
                const orgCheck = await client.query(
                    'SELECT id FROM organizations WHERE id = $1',
                    [orgId]
                );

                if (orgCheck.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Organization not found' });
                }
            }

            // Check if user already exists in this organization
            const existingUser = await client.query(
                'SELECT id FROM users WHERE email = $1 AND organization_id = $2',
                [email, orgId]
            );

            if (existingUser.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'User with this email already exists in this organization' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const result = await client.query(
                `INSERT INTO users (organization_id, email, password_hash, name, role, hourly_rate)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, email, name, role, hourly_rate, avatar_url, organization_id`,
                [orgId, email, passwordHash, name, role, hourlyRate || 0]
            );

            const user = result.rows[0];

            // If new organization, make user owner
            if (isNewOrganization) {
                await client.query(
                    'INSERT INTO organization_members (user_id, organization_id, role) VALUES ($1, $2, $3)',
                    [user.id, orgId, 'owner']
                );
            } else {
                // Add as regular member
                await client.query(
                    'INSERT INTO organization_members (user_id, organization_id, role) VALUES ($1, $2, $3)',
                    [user.id, orgId, 'member']
                );
            }

            await client.query('COMMIT');

            const token = generateToken(user.id, user.email);

            res.status(201).json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    hourlyRate: user.hourly_rate,
                    avatarUrl: user.avatar_url,
                    organizationId: user.organization_id,
                },
                token,
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, organizationId } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        let query, params;

        // If organizationId provided, find user in that organization
        // Otherwise, find any user with that email
        if (organizationId) {
            query = 'SELECT id, email, password_hash, name, role, hourly_rate, avatar_url, organization_id FROM users WHERE email = $1 AND organization_id = $2';
            params = [email, organizationId];
        } else {
            query = 'SELECT id, email, password_hash, name, role, hourly_rate, avatar_url, organization_id FROM users WHERE email = $1 LIMIT 1';
            params = [email];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Get user's organizations
        const orgsResult = await pool.query(
            `SELECT o.id, o.name, o.subdomain, om.role as user_role
             FROM organizations o
             INNER JOIN organization_members om ON om.organization_id = o.id
             WHERE om.user_id = $1
             ORDER BY o.created_at DESC`,
            [user.id]
        );

        const token = generateToken(user.id, user.email);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                hourlyRate: user.hourly_rate,
                avatarUrl: user.avatar_url,
                organizationId: user.organization_id,
            },
            organizations: orgsResult.rows,
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
            'SELECT id, email, name, role, hourly_rate, avatar_url, organization_id FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Get user's organizations
        const orgsResult = await pool.query(
            `SELECT o.id, o.name, o.subdomain, om.role as user_role
             FROM organizations o
             INNER JOIN organization_members om ON om.organization_id = o.id
             WHERE om.user_id = $1
             ORDER BY o.created_at DESC`,
            [user.id]
        );

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            hourlyRate: user.hourly_rate,
            avatarUrl: user.avatar_url,
            organizationId: user.organization_id,
            organizations: orgsResult.rows,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
