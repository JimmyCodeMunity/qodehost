const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const dbConnect = require('./services/dbconnection');

const app = express();
const port = process.env.PORT || 5000;

dotenv.config();

app.use(cors({
    origin: process.env.CLIENT_URL || "https://qodetechnologies.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

dbConnect();

// health route with server statuses
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});


// admin routes
const adminroutes = require('./routes/adminRoutes');
app.use('/api/v1/admin', adminroutes);

// user routes
const userroutes = require('./routes/userRoutes');
app.use('/api/v1/users', userroutes);

// contact routes
const contactroutes = require('./routes/contactRoutes');
app.use('/api/v1/contacts', contactroutes);

// project routes
const projectroutes = require('./routes/projectRoutes');
app.use('/api/v1/projects', projectroutes);