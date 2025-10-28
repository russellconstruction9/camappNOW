import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all projects
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        const projects = result.rows;

        // Get punch lists and photos for each project
        for (const project of projects) {
            const punchListResult = await pool.query(
                'SELECT id, text, is_complete FROM punch_list_items WHERE project_id = $1 ORDER BY created_at ASC',
                [project.id]
            );
            project.punchList = punchListResult.rows.map(item => ({
                id: item.id,
                text: item.text,
                isComplete: item.is_complete,
            }));

            const photosResult = await pool.query(
                'SELECT id, storage_url as imageDataUrl, description, date_added FROM project_photos WHERE project_id = $1 ORDER BY date_added DESC',
                [project.id]
            );
            project.photos = photosResult.rows;
        }

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single project
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projectResult.rows[0];

        // Get punch list items
        const punchListResult = await pool.query(
            'SELECT id, text, is_complete FROM punch_list_items WHERE project_id = $1 ORDER BY created_at ASC',
            [id]
        );
        project.punchList = punchListResult.rows.map(item => ({
            id: item.id,
            text: item.text,
            isComplete: item.is_complete,
        }));

        // Get photos
        const photosResult = await pool.query(
            'SELECT id, storage_url as imageDataUrl, description, date_added FROM project_photos WHERE project_id = $1 ORDER BY date_added DESC',
            [id]
        );
        project.photos = photosResult.rows;

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create project
router.post('/', async (req, res) => {
    try {
        const { name, address, type, status, startDate, endDate, budget } = req.body;

        if (!name || !address || !type || !status || !startDate || !endDate || budget === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO projects (name, address, type, status, start_date, end_date, budget)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, address, type, status, startDate, endDate, budget]
        );

        const project = result.rows[0];
        project.punchList = [];
        project.photos = [];

        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update project
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, type, status, startDate, endDate, budget } = req.body;

        const result = await pool.query(
            `UPDATE projects 
             SET name = $1, address = $2, type = $3, status = $4, start_date = $5, end_date = $6, budget = $7, updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [name, address, type, status, startDate, endDate, budget, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add punch list item
router.post('/:id/punch-list', async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await pool.query(
            'INSERT INTO punch_list_items (project_id, text) VALUES ($1, $2) RETURNING *',
            [id, text]
        );

        res.status(201).json({
            id: result.rows[0].id,
            text: result.rows[0].text,
            isComplete: result.rows[0].is_complete,
        });
    } catch (error) {
        console.error('Error adding punch list item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Toggle punch list item
router.put('/:projectId/punch-list/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;

        const result = await pool.query(
            'UPDATE punch_list_items SET is_complete = NOT is_complete WHERE id = $1 RETURNING *',
            [itemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({
            id: result.rows[0].id,
            text: result.rows[0].text,
            isComplete: result.rows[0].is_complete,
        });
    } catch (error) {
        console.error('Error toggling punch list item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

