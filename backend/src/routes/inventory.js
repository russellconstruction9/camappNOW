import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_items ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create inventory item
router.post('/', async (req, res) => {
    try {
        const { name, quantity, unit, cost, lowStockThreshold } = req.body;

        if (!name || quantity === undefined || !unit) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            'INSERT INTO inventory_items (name, quantity, unit, cost, low_stock_threshold) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, quantity, unit, cost || null, lowStockThreshold || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update inventory item
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, quantity, unit, cost, lowStockThreshold } = req.body;

        const result = await pool.query(
            'UPDATE inventory_items SET name = $1, quantity = $2, unit = $3, cost = $4, low_stock_threshold = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
            [name, quantity, unit, cost || null, lowStockThreshold || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM inventory_items WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

