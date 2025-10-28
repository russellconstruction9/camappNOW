import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { setOrganizationContext } from '../middleware/organization.js';

const router = express.Router();

router.use(authenticateToken);
router.use(setOrganizationContext);

// Get all users in organization
router.get('/', async (req, res) => {
    try {
        const { organizationId } = req;
        
        const result = await pool.query(
            'SELECT id, email, name, role, hourly_rate, avatar_url, created_at FROM users WHERE organization_id = $1 ORDER BY name ASC',
            [organizationId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        
        const result = await pool.query(
            'SELECT id, email, name, role, hourly_rate, avatar_url, created_at FROM users WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        const { name, role, hourlyRate, avatarUrl } = req.body;

        const result = await pool.query(
            'UPDATE users SET name = $1, role = $2, hourly_rate = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND organization_id = $6 RETURNING id, email, name, role, hourly_rate, avatar_url',
            [name, role, hourlyRate, avatarUrl || null, id, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
