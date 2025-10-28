import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

export const generateToken = (userId, email) => {
    return jwt.sign({ userId, email }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

