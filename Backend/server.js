const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const driveRoutes = require('./routes/driveRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Enable CORS for all incoming origins (Netlify, Localhost, Vercel previews, mobile)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check & Root Diagnostics Handler (Connects to DB and reports live status)
const getHealthStatus = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in health check:', err.message);
  }

  const dbState = mongoose.connection ? mongoose.connection.readyState : 0;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'Placement Management System API is live on Vercel',
    database: dbStatusMap[dbState] || 'unknown',
    isDatabaseConnected: dbState === 1,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
};

// Root routes
app.get('/', getHealthStatus);
app.get('/health', getHealthStatus);
app.get('/api', getHealthStatus);
app.get('/api/health', getHealthStatus);

// Database connection middleware for functional API endpoints
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err.message);
    res.status(503).json({
      success: false,
      message:
        'Database connection failed. In MongoDB Atlas, verify that Network Access has 0.0.0.0/0 (Allow access from anywhere) enabled.',
      error: err.message,
    });
  }
});

// Construct Unified API Router
const apiRouter = express.Router();
apiRouter.get('/health', getHealthStatus);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/drives', driveRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/company', companyRoutes);
apiRouter.use('/admin', adminRoutes);

// Mount router on BOTH '/api' and '/' to ensure 100% route compatibility
// whether Vercel preserves '/api' prefix or strips it
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Server Listening (Only when NOT running inside Vercel serverless environment)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export for Vercel Serverless Function handler
module.exports = app;
