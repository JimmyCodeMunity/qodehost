const mongoose = require('mongoose');
const config = require('../config/config');

const dbConnect = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log(`Database connected (${config.isDevelopment ? 'development' : 'production'} mode)`);
    } catch (error) {
        console.error('Database connection error:', error);
        if (config.isProduction) {
            process.exit(1);
        }
    }
}

module.exports = dbConnect;
