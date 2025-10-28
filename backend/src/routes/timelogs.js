import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Clock in
router.post('/clock-in', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Check if user is already clocked in
        const activeLog = await pool.query(
            'SELECT id FROM time_logs WHERE user_id = $1 AND clock_out IS NULL',
            [userId]
        );

        if (activeLog.rows.length > 0) {
            return res.status(400).json({ error: 'User is already clocked in' });
        }

        const clockIn = new Date();
        const clockInLocation = req.body.clockInLocation || null;

        const result = await pool.query(
            `INSERT INTO time_logs (user_id, project_id, clock_in, clock_in_location)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, projectId, clockIn, clockInLocation ? JSON.stringify(clockInLocation) : null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error clocking in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clock out
router.post('/clock-out', async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find active time log
        const activeLog = await pool.query(
            'SELECT * FROM time_logs WHERE user_id = $1 AND clock_out IS NULL',
            [userId]
        );

        if (activeLog.rows.length === 0) {
            return res.status(400).json({ error: 'No active time log found' });
        }

        const log = activeLog.rows[0];
        const clockOut = new Date();
        const clockOutLocation = req.body.clockOutLocation || null;

        // Calculate duration
        const durationMs = clockOut.getTime() - new Date(log.clock_in).getTime();

        // Get user's hourly rate to calculate cost
        const userResult = await pool.query('SELECT hourly_rate FROM users WHERE id = $1', [userId]);
        const hourlyRate = userResult.rows[0]?.hourly_rate || 0;
        const cost = (durationMs / (1000 * 60 * 60)) * hourlyRate;

        const result = await pool.query(
            `UPDATE time_logs 
             SET clock_out = $1, 
                 duration_ms = $2, 
                 cost = $3,
                 clock_out_location = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [clockOut, durationMs, cost, clockOutLocation ? JSON.stringify(clockOutLocation) : null, log.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error clocking out:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Switch job (clock out of current, clock in to new)
router.post('/switch', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { newProjectId } = req.body;

        if (!newProjectId) {
            return res.status(400).json({ error: 'New project ID is required' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Clock out from current job
            const activeLog = await client.query(
                'SELECT * FROM time_logs WHERE user_id = $1 AND clock_out IS NULL',
                [userId]
            );

            if (activeLog.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'No active time log to switch from' });
            }

            const log = activeLog.rows[0];
            const clockOut = new Date();
            const clockOutLocation = req.body.clockOutLocation || null;

            const durationMs = clockOut.getTime() - new Date(log.clock_in).getTime();

            const userResult = await client.query('SELECT hourly_rate FROM users WHERE id = $1', [userId]);
            const hourlyRate = userResult.rows[0]?.hourly_rate || 0;
            const cost = (durationMs / (1000 * 60 * 60)) * hourlyRate;

            await client.query(
                `UPDATE time_logs 
                 SET clock_out = $1, 
                     duration_ms = $2, 
                     cost = $3,
                     clock_out_location = $4,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5`,
                [clockOut, durationMs, cost, clockOutLocation ? JSON.stringify(clockOutLocation) : null, log.id]
            );

            // Clock in to new job
            const newClockIn = new Date();
            const clockInLocation = req.body.clockInLocation || null;

            const newLogResult = await client.query(
                `INSERT INTO time_logs (user_id, project_id, clock_in, clock_in_location)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [userId, newProjectId, newClockIn, clockInLocation ? JSON.stringify(clockInLocation) : null]
            );

            await client.query('COMMIT');

            res.status(201).json({
                clockedOutLog: activeLog.rows[0],
                clockedInLog: newLogResult.rows[0],
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error switching job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all time logs for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUserId = req.user.userId;

        // Only allow users to see their own logs unless admin
        if (parseInt(userId) !== requestingUserId) {
            const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [requestingUserId]);
            if (userResult.rows[0]?.role !== 'Admin') {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const result = await pool.query(
            `SELECT * FROM time_logs WHERE user_id = $1 ORDER BY clock_in DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching time logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

