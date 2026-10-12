import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import logger from './utils/logger';
import { initializeDatabase } from './database/connection';
import shopRoutes from './routes/shops';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import integrationRoutes from './routes/integration';
import productRoutes from './routes/products';
import statisticsRoutes from './routes/statistics';
import groupRoutes from './routes/groups';
import scheduleRoutes, { setScheduler } from './routes/schedules';
import exportRoutes from './routes/export';
import TaskQueue from './services/taskQueue';
import WebSocketService from './services/websocket';
import SchedulerService from './services/scheduler';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

let taskQueue: TaskQueue;
let wsService: WebSocketService;
let schedulerService: SchedulerService;

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
app.use('/api/schedules', scheduleRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      websocket: wsService ? 'connected' : 'disconnected',
      taskQueue: taskQueue ? 'running' : 'stopped',
      scheduler: schedulerService ? 'running' : 'stopped'
    }
  });
});

// WebSocket stats endpoint
app.get('/api/stats/websocket', (req, res) => {
  if (wsService) {
    res.json({ data: wsService.getStats() });
  } else {
    res.status(503).json({ error: 'WebSocket service not available' });
  }
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

    // 初始化WebSocket服务
    wsService = new WebSocketService(httpServer);
    logger.info('WebSocket service initialized');

    // 初始化定时任务
    schedulerService = new SchedulerService(process.env.BITBROWSER_API_URL);
    schedulerService.initializeDefaultJobs();
    setScheduler(schedulerService);
    logger.info('Scheduler service initialized');

    // 初始化任务队列
    taskQueue = new TaskQueue(process.env.BITBROWSER_API_URL);
    await taskQueue.initialize();

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`WebSocket available at ws://localhost:${PORT}`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      taskQueue.stop();
      schedulerService.stopAll();
      wsService.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
