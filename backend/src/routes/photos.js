import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(authenticateToken);

// Get all photos for a project
router.get('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const result = await pool.query(
            'SELECT * FROM project_photos WHERE project_id = $1 ORDER BY date_added DESC',
            [projectId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload URL generation (for client-side direct uploads)
router.post('/projects/:projectId/upload-url', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { contentType, count } = req.body;

        // For now, we'll return local upload URLs
        // In production, this would generate pre-signed URLs for cloud storage
        const uploadUrls = [];
        for (let i = 0; i < (count || 1); i++) {
            uploadUrls.push({
                uploadUrl: `/api/v1/photos/upload?projectId=${projectId}&index=${i}`,
                accessUrl: `/uploads/projects/${projectId}/${Date.now()}-${i}.jpg`,
            });
        }

        res.json({ urls: uploadUrls });
    } catch (error) {
        console.error('Error generating upload URLs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload photo (local storage)
router.post('/upload', async (req, res) => {
    try {
        const { projectId } = req.query;
        const formData = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../../uploads/projects', projectId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // For local storage, you would process the uploaded file here
        // This is a simplified version - you'd use multer for actual file handling
        
        const filename = `${Date.now()}.jpg`;
        const storageUrl = `/uploads/projects/${projectId}/${filename}`;

        // In a real implementation, you'd save the file and return the URL
        res.json({ storageUrl, message: 'Photo uploaded successfully' });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create photo record after upload
router.post('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { storageUrl, description } = req.body;

        if (!storageUrl) {
            return res.status(400).json({ error: 'Storage URL is required' });
        }

        const result = await pool.query(
            'INSERT INTO project_photos (project_id, storage_url, description) VALUES ($1, $2, $3) RETURNING *',
            [projectId, storageUrl, description || '']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating photo record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete photo
router.delete('/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;

        // Get the photo to delete the file
        const photoResult = await pool.query('SELECT * FROM project_photos WHERE id = $1', [photoId]);
        
        if (photoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        // Delete the file (local storage)
        const photo = photoResult.rows[0];
        if (photo.storage_url) {
            const filePath = path.join(__dirname, '../..', photo.storage_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete the database record
        await pool.query('DELETE FROM project_photos WHERE id = $1', [photoId]);

        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

