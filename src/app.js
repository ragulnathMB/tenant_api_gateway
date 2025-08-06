require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Routes
const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const apiRoutes = require('./routes/api.routes');
const proxyRoutes = require('./routes/proxy.routes');

// Middleware
const errorHandler = require('./middleware/error_handler');
const { initializeDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', tenantRoutes);
app.use('/api', apiRoutes);
app.use('/', proxyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Tenant Portal',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database
const initializeApp = async () => {
  try {
    await initializeDatabase();
    console.log('Tenant Portal application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

module.exports = { app, initializeApp };
