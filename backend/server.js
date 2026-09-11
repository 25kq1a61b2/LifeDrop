const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donors', require('./routes/donorRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'LifeDrop – Blood Shortage Management System API',
    timestamp: new Date().toISOString(),
  });
});

// For any non-API route, if requested without an extension, serve corresponding HTML or index.html
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  // Try sending the requested html file or fallback to index.html
  const potentialHtml = path.join(frontendPath, `${req.path}.html`);
  res.sendFile(potentialHtml, (err) => {
    if (err) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  LifeDrop Server is running on port: ${PORT}`);
  console.log(`  Web Application: http://localhost:${PORT}`);
  console.log(`  API Base URL:    http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
