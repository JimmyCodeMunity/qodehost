const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/config');
const dbConnect = require('./services/dbconnection');

const app = express();
const port = config.PORT;

// Use dynamic CORS configuration
app.use(cors(config.corsOptions));
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

// service request routes
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
app.use('/api/v1/service-requests', serviceRequestRoutes);

// lead routes
const leadRoutes = require('./routes/leadRoutes');
app.use('/api/v1/leads', leadRoutes);

// dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/v1/dashboard', dashboardRoutes);

// site settings routes
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
app.use('/api/v1/settings', siteSettingsRoutes);
