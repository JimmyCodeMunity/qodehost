// Backend Configuration with Environment Detection
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`)
});

const config = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server configuration
  PORT: process.env.PORT || 5000,

  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/qode_dev',

  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

  // Email configuration
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'Qode <noreply@qode.com>',

  // Frontend URL for CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // CORS configuration
  corsOptions: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:3000',
        'https://qodetechnologies.vercel.app',
        // Allow all Vercel preview URLs for qodetechnologies
        /https:\/\/qodetechnologies-.*\.vercel\.app/
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === 'production') {
        // In production, check if origin matches any allowed origin or pattern
        const isAllowed = allowedOrigins.some(allowed => {
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return allowed === origin;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // In development, allow all origins
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

// Validation
if (!config.EMAIL_USERNAME || !config.EMAIL_PASSWORD) {
  console.warn('Warning: Email credentials not configured. Email functionality will not work.');
}

if (config.isProduction && config.JWT_SECRET === 'fallback_jwt_secret_key') {
  console.error('ERROR: JWT_SECRET must be set in production!');
  process.exit(1);
}

module.exports = config;
