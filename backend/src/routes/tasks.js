import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { setOrganizationContext } from '../middleware/organization.js';

const router = express.Router();

router.use(authenticateToken);
router.use(setOrganizationContext);

// Get all tasks (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { organizationId } = req;
        const { projectId, assigneeId, status } = req.query;
        
        let query = 'SELECT * FROM tasks WHERE organization_id = $1';
        const params = [organizationId];
        let paramCount = 1;

        if (projectId) {
            paramCount++;
            query += ` AND project_id = $${paramCount}`;
            params.push(projectId);
        }

        if (assigneeId) {
            paramCount++;
            query += ` AND assignee_id = $${paramCount}`;
            params.push(assigneeId);
        }

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single task
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        
        const result = await pool.query(
            'SELECT * FROM tasks WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create task
router.post('/', async (req, res) => {
    try {
        const { organizationId } = req;
        const { title, description, projectId, assigneeId, dueDate, status } = req.body;

        if (!title || !projectId || !assigneeId || !dueDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO tasks (organization_id, title, description, project_id, assignee_id, due_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [organizationId, title, description || '', projectId, assigneeId, dueDate, status || 'To Do']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        const { title, description, projectId, assigneeId, dueDate, status } = req.body;

        const updates = [];
        const params = [organizationId];
        let paramCount = 1;

        if (title !== undefined) {
            paramCount++;
            updates.push(`title = $${paramCount}`);
            params.push(title);
        }
        if (description !== undefined) {
            paramCount++;
            updates.push(`description = $${paramCount}`);
            params.push(description);
        }
        if (projectId !== undefined) {
            paramCount++;
            updates.push(`project_id = $${paramCount}`);
            params.push(projectId);
        }
        if (assigneeId !== undefined) {
            paramCount++;
            updates.push(`assignee_id = $${paramCount}`);
            params.push(assigneeId);
        }
        if (dueDate !== undefined) {
            paramCount++;
            updates.push(`due_date = $${paramCount}`);
            params.push(dueDate);
        }
        if (status !== undefined) {
            paramCount++;
            updates.push(`status = $${paramCount}`);
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        paramCount++;
        params.push(id);

        const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} AND organization_id = $1 RETURNING *`;
        
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
