import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { setOrganizationContext } from '../middleware/organization.js';

const router = express.Router();

router.use(authenticateToken);
router.use(setOrganizationContext);

// Get all expenses for a project
router.get('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { organizationId } = req;

        // Verify project belongs to organization
        const projectCheck = await pool.query(
            'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
            [projectId, organizationId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const result = await pool.query(
            'SELECT * FROM expenses WHERE project_id = $1 AND organization_id = $2 ORDER BY date DESC',
            [projectId, organizationId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all expenses for organization
router.get('/', async (req, res) => {
    try {
        const { organizationId } = req;

        const result = await pool.query(
            'SELECT * FROM expenses WHERE organization_id = $1 ORDER BY date DESC',
            [organizationId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create expense
router.post('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { organizationId } = req;
        const { description, amount, date, vendor } = req.body;

        if (!description || amount === undefined || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify project belongs to organization
        const projectCheck = await pool.query(
            'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
            [projectId, organizationId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const result = await pool.query(
            'INSERT INTO expenses (organization_id, project_id, description, amount, date, vendor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [organizationId, projectId, description, amount, date, vendor || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        const { description, amount, date, vendor } = req.body;

        const result = await pool.query(
            'UPDATE expenses SET description = $1, amount = $2, date = $3, vendor = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND organization_id = $6 RETURNING *',
            [description, amount, date, vendor || null, id, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        
        const result = await pool.query(
            'DELETE FROM expenses WHERE id = $1 AND organization_id = $2 RETURNING id',
            [id, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
