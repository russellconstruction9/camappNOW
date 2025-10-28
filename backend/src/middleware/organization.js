import pool from '../db/index.js';

/**
 * Middleware to ensure user belongs to organization and set req.organizationId
 * This prevents users from accessing data from other organizations
 */
export const requireOrganizationMembership = (req, res, next) => {
    // This will be set by the organization context middleware
    if (!req.organizationId) {
        return res.status(403).json({ error: 'Organization context required' });
    }
    next();
};

/**
 * Middleware to set organization context for authenticated users
 * Can get organization from:
 * 1. Query parameter ?organizationId
 * 2. Request body
 * 3. User's default organization
 */
export const setOrganizationContext = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Get organization ID from query, body, or user's primary organization
        let organizationId = req.query.organizationId || req.body.organizationId;

        // If not provided, get user's default organization
        if (!organizationId) {
            const userResult = await pool.query(
                'SELECT organization_id FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            organizationId = userResult.rows[0].organization_id;
        }

        // Verify user belongs to this organization
        const membershipResult = await pool.query(
            `SELECT om.role 
             FROM users u
             LEFT JOIN organization_members om ON om.user_id = u.id AND om.organization_id = $2
             WHERE u.id = $1 AND u.organization_id = $2`,
            [userId, organizationId]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied: User does not belong to this organization' });
        }

        // Set organization context
        req.organizationId = parseInt(organizationId);
        req.userRole = membershipResult.rows[0].role || 'member';

        next();
    } catch (error) {
        console.error('Error setting organization context:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware to require specific role(s)
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(403).json({ error: 'User role not found' });
        }

        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

