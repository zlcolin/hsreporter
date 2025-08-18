import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Import middleware
import { helmet, cors, corsOptions, helmetOptions, apiLimiter } from '@/middleware/security';
import { requestLogger } from '@/middleware/requestLogger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

// Import routes
import apiRoutes from '@/routes';

// Import utilities
import logger from '@/utils/logger';

// Load environment variables
dotenv.config();

const app = express();

// Create necessary directories
const uploadsDir = path.join(__dirname, '../uploads');
const logsDir = path.join(__dirname, '../logs');

[uploadsDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security middleware
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

// Rate limiting
app.use('/api', apiLimiter);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Static file serving
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', apiRoutes);

// Health check endpoint (without /api prefix for load balancers)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default app;