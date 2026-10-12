import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { initializeDatabase } from './database/connection';
import shopRoutes from './routes/shops';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import integrationRoutes from './routes/integration';
import productRoutes from './routes/products';
import statisticsRoutes from './routes/statistics';
import groupRoutes from './routes/groups';
import TaskQueue from './services/taskQueue';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
let taskQueue: TaskQueue;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/groups', groupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
async function start() {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // 初始化任务队列
    taskQueue = new TaskQueue(process.env.BITBROWSER_API_URL);
    await taskQueue.initialize();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      taskQueue.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
