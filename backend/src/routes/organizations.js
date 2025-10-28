import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { setOrganizationContext, requireRole } from '../middleware/organization.js';

const router = express.Router();

router.use(authenticateToken);

// Get user's organizations
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT o.*, om.role as user_role
             FROM organizations o
             INNER JOIN organization_members om ON om.organization_id = o.id
             WHERE om.user_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single organization
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Check if user has access to this organization
        const result = await pool.query(
            `SELECT o.*, om.role as user_role
             FROM organizations o
             INNER JOIN organization_members om ON om.organization_id = o.id
             WHERE o.id = $1 AND om.user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Organization not found or access denied' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create organization
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, subdomain, domain } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Organization name is required' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Create organization
            const orgResult = await client.query(
                `INSERT INTO organizations (name, subdomain, domain)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [name, subdomain || null, domain || null]
            );

            const organization = orgResult.rows[0];

            // Add creator as owner
            await client.query(
                `INSERT INTO organization_members (user_id, organization_id, role)
                 VALUES ($1, $2, 'owner')`,
                [userId, organization.id]
            );

            // Update user's primary organization
            await client.query(
                'UPDATE users SET organization_id = $1 WHERE id = $2',
                [organization.id, userId]
            );

            await client.query('COMMIT');

            res.status(201).json(organization);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update organization (owner/admin only)
router.put('/:id', setOrganizationContext, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subdomain, domain, plan, max_users } = req.body;

        const result = await pool.query(
            `UPDATE organizations 
             SET name = COALESCE($1, name),
                 subdomain = COALESCE($2, subdomain),
                 domain = COALESCE($3, domain),
                 plan = COALESCE($4, plan),
                 max_users = COALESCE($5, max_users),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [name, subdomain, domain, plan, max_users, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete organization (owner only)
router.delete('/:id', setOrganizationContext, requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM organizations WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get organization members
router.get('/:id/members', setOrganizationContext, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.role as job_role, om.role as org_role, om.joined_at
             FROM organization_members om
             INNER JOIN users u ON u.id = om.user_id
             WHERE om.organization_id = $1
             ORDER BY om.joined_at ASC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add member to organization (admin/owner only)
router.post('/:id/members', setOrganizationContext, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        // Find user by email in the organization
        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND organization_id = $2',
            [email, id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found in this organization' });
        }

        const userId = userResult.rows[0].id;

        // Add to organization members
        const result = await pool.query(
            `INSERT INTO organization_members (user_id, organization_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, organization_id) 
             DO UPDATE SET role = $3
             RETURNING *`,
            [userId, id, role]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove member from organization (admin/owner only)
router.delete('/:id/members/:userId', setOrganizationContext, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { id, userId } = req.params;

        // Prevent removing the owner
        const checkOwner = await pool.query(
            'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (checkOwner.rows[0]?.role === 'owner') {
            return res.status(400).json({ error: 'Cannot remove organization owner' });
        }

        const result = await pool.query(
            'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

