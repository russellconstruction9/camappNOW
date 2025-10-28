import dotenv from 'dotenv';

dotenv.config();

export default {
    port: process.env.PORT || 3001,
    db: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'constructtrack_pro',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },
    storage: {
        provider: process.env.STORAGE_PROVIDER || 'local', // 'local', 's3', 'gcs'
        localPath: process.env.LOCAL_STORAGE_PATH || './uploads',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    }
};

