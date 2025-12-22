import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import router from './routes';
import { pool } from './db/connection';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DC Community Pulse API',
    version: '1.0.0',
    description: 'Real-time community intelligence dashboard for Washington, DC',
    endpoints: {
      health: '/api/health',
      signals: '/api/signals',
      wards: '/api/wards',
      sources: '/api/sources',
      sentiment: '/api/sentiment/citywide',
      keywords: '/api/keywords',
      collector: {
        status: 'GET /api/collector/status',
        sources: 'GET /api/collector/sources',
        stats: 'GET /api/collector/stats',
        run: 'POST /api/collector/run/:slug',
        runAll: 'POST /api/collector/run-all',
        schedulerStart: 'POST /api/collector/scheduler/start',
        schedulerStop: 'POST /api/collector/scheduler/stop',
      },
      dev: '/api/dev/generate-mock-data',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log('DC Community Pulse API');
  console.log('=================================');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await pool.end();
  process.exit(0);
});

export default app;
