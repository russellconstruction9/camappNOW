import express from 'express';
import pool from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { setOrganizationContext } from '../middleware/organization.js';

const router = express.Router();

router.use(authenticateToken);
router.use(setOrganizationContext);

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const { organizationId } = req;
        
        const result = await pool.query(
            'SELECT * FROM invoices WHERE organization_id = $1 ORDER BY date_issued DESC',
            [organizationId]
        );
        const invoices = result.rows;

        // Get line items for each invoice
        for (const invoice of invoices) {
            const lineItemsResult = await pool.query(
                'SELECT * FROM invoice_line_items WHERE invoice_id = $1',
                [invoice.id]
            );
            
            const lineItems = await Promise.all(lineItemsResult.rows.map(async (item) => {
                // Get time log IDs associated with this line item
                const timeLogResult = await pool.query(
                    'SELECT time_log_id FROM time_log_invoice_line_items WHERE invoice_line_item_id = $1',
                    [item.id]
                );
                
                return {
                    id: item.id.toString(),
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    rate: parseFloat(item.rate),
                    amount: parseFloat(item.amount),
                    timeLogIds: timeLogResult.rows.map(r => r.time_log_id),
                };
            }));

            invoice.lineItems = lineItems;
        }

        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single invoice
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;

        const invoiceResult = await pool.query(
            'SELECT * FROM invoices WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = invoiceResult.rows[0];

        // Get line items
        const lineItemsResult = await pool.query(
            'SELECT * FROM invoice_line_items WHERE invoice_id = $1',
            [id]
        );

        const lineItems = await Promise.all(lineItemsResult.rows.map(async (item) => {
            const timeLogResult = await pool.query(
                'SELECT time_log_id FROM time_log_invoice_line_items WHERE invoice_line_item_id = $1',
                [item.id]
            );
            
            return {
                id: item.id.toString(),
                description: item.description,
                quantity: parseFloat(item.quantity),
                rate: parseFloat(item.rate),
                amount: parseFloat(item.amount),
                timeLogIds: timeLogResult.rows.map(r => r.time_log_id),
            };
        }));

        invoice.lineItems = lineItems;
        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create invoice
router.post('/', async (req, res) => {
    try {
        const { organizationId } = req;
        const { invoiceNumber, projectId, dateIssued, dueDate, status, notes, lineItems, subtotal, taxRate, taxAmount, total } = req.body;

        if (!invoiceNumber || !projectId || !dateIssued || !dueDate || !status || !lineItems || subtotal === undefined || taxRate === undefined || taxAmount === undefined || total === undefined) {
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

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Create invoice
            const invoiceResult = await client.query(
                `INSERT INTO invoices (organization_id, invoice_number, project_id, date_issued, due_date, status, notes, subtotal, tax_rate, tax_amount, total)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [organizationId, invoiceNumber, projectId, dateIssued, dueDate, status, notes || '', subtotal, taxRate, taxAmount, total]
            );

            const invoice = invoiceResult.rows[0];

            // Create line items and associations
            for (const item of lineItems) {
                const lineItemResult = await client.query(
                    `INSERT INTO invoice_line_items (invoice_id, description, quantity, rate, amount)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING *`,
                    [invoice.id, item.description, item.quantity, item.rate, item.amount]
                );

                const lineItem = lineItemResult.rows[0];

                // Link time logs if provided and verify they belong to organization
                if (item.timeLogIds && item.timeLogIds.length > 0) {
                    for (const timeLogId of item.timeLogIds) {
                        // Verify time log belongs to organization
                        const timeLogCheck = await client.query(
                            'SELECT id FROM time_logs WHERE id = $1 AND organization_id = $2',
                            [timeLogId, organizationId]
                        );

                        if (timeLogCheck.rows.length > 0) {
                            await client.query(
                                `INSERT INTO time_log_invoice_line_items (time_log_id, invoice_line_item_id) VALUES ($1, $2)`,
                                [timeLogId, lineItem.id]
                            );

                            // Update time log with invoice ID
                            await client.query(
                                'UPDATE time_logs SET invoice_id = $1 WHERE id = $2 AND organization_id = $3',
                                [invoice.id, timeLogId, organizationId]
                            );
                        }
                    }
                }
            }

            await client.query('COMMIT');
            
            // Return the created invoice with line items
            const createdInvoiceResult = await client.query(
                'SELECT * FROM invoices WHERE id = $1',
                [invoice.id]
            );
            res.status(201).json(createdInvoiceResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update invoice
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        const { invoiceNumber, projectId, dateIssued, dueDate, status, notes, lineItems, subtotal, taxRate, taxAmount, total } = req.body;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Verify invoice belongs to organization
            const invoiceCheck = await client.query(
                'SELECT id FROM invoices WHERE id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            if (invoiceCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Invoice not found' });
            }

            // Update invoice
            await client.query(
                `UPDATE invoices 
                 SET invoice_number = $1, project_id = $2, date_issued = $3, due_date = $4, status = $5, notes = $6, 
                     subtotal = $7, tax_rate = $8, tax_amount = $9, total = $10, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $11 AND organization_id = $12`,
                [invoiceNumber, projectId, dateIssued, dueDate, status, notes || '', subtotal, taxRate, taxAmount, total, id, organizationId]
            );

            // Delete existing line items and associations
            const existingLineItemsResult = await client.query(
                'SELECT id FROM invoice_line_items WHERE invoice_id = $1',
                [id]
            );

            for (const lineItem of existingLineItemsResult.rows) {
                await client.query('DELETE FROM time_log_invoice_line_items WHERE invoice_line_item_id = $1', [lineItem.id]);
            }
            await client.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);

            // Remove invoice ID from time logs
            await client.query(
                'UPDATE time_logs SET invoice_id = NULL WHERE invoice_id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            // Create new line items
            if (lineItems) {
                for (const item of lineItems) {
                    const lineItemResult = await client.query(
                        `INSERT INTO invoice_line_items (invoice_id, description, quantity, rate, amount)
                         VALUES ($1, $2, $3, $4, $5)
                         RETURNING *`,
                        [id, item.description, item.quantity, item.rate, item.amount]
                    );

                    const lineItem = lineItemResult.rows[0];

                    if (item.timeLogIds && item.timeLogIds.length > 0) {
                        for (const timeLogId of item.timeLogIds) {
                            // Verify time log belongs to organization
                            const timeLogCheck = await client.query(
                                'SELECT id FROM time_logs WHERE id = $1 AND organization_id = $2',
                                [timeLogId, organizationId]
                            );

                            if (timeLogCheck.rows.length > 0) {
                                await client.query(
                                    'INSERT INTO time_log_invoice_line_items (time_log_id, invoice_line_item_id) VALUES ($1, $2)',
                                    [timeLogId, lineItem.id]
                                );

                                await client.query(
                                    'UPDATE time_logs SET invoice_id = $1 WHERE id = $2 AND organization_id = $3',
                                    [id, timeLogId, organizationId]
                                );
                            }
                        }
                    }
                }
            }

            await client.query('COMMIT');

            const result = await client.query(
                'SELECT * FROM invoices WHERE id = $1',
                [id]
            );
            res.json(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Verify invoice belongs to organization
            const invoiceCheck = await client.query(
                'SELECT id FROM invoices WHERE id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            if (invoiceCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Invoice not found' });
            }

            // Get line items
            const lineItemsResult = await client.query(
                'SELECT id FROM invoice_line_items WHERE invoice_id = $1',
                [id]
            );

            // Delete time log associations
            for (const lineItem of lineItemsResult.rows) {
                await client.query('DELETE FROM time_log_invoice_line_items WHERE invoice_line_item_id = $1', [lineItem.id]);
            }

            // Delete line items
            await client.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);

            // Remove invoice ID from time logs
            await client.query(
                'UPDATE time_logs SET invoice_id = NULL WHERE invoice_id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            // Delete invoice
            await client.query(
                'DELETE FROM invoices WHERE id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            await client.query('COMMIT');

            res.json({ message: 'Invoice deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
