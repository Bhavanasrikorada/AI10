const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const seedDB = require('./utils/seeder');
const requestLogger = require('./middleware/loggerMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const slaRoutes = require('./routes/slaRoutes');
const becknRoutes = require('./routes/becknRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    name: 'DPI-Enabled AI Agent Marketplace Beckn BPP',
    domain: 'ai-agents',
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Backend REST API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/sla', slaRoutes);
app.use('/beckn', becknRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server and Database
async function startServer() {
  await connectDB();
  await seedDB(false);

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Beckn BPP & AI Marketplace Backend running on port ${PORT}`);
    console.log(` Health: http://localhost:${PORT}/health`);
    console.log(` Beckn Gateway: http://localhost:${PORT}/beckn`);
    console.log(` REST APIs: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received: closing HTTP server');
    server.close(() => console.log('HTTP server closed'));
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
