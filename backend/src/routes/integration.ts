import express, { Request, Response } from 'express';
import BitBrowserService from '../services/bitbrowser';
import TaskExecutor from '../services/taskExecutor';
import logger from '../utils/logger';

const router = express.Router();

/**
 * 测试比特浏览器连接
 */
router.post('/bitbrowser/health', async (req: Request, res: Response) => {
  try {
    const bitbrowser = new BitBrowserService();
    const isHealthy = await bitbrowser.healthCheck();

    if (isHealthy) {
      res.json({ status: 'ok', message: 'BitBrowser is available' });
    } else {
      res.status(503).json({ error: 'BitBrowser service is not available' });
    }
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      error: 'BitBrowser service is not available',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取比特浏览器分组列表
 */
router.get('/bitbrowser/groups', async (req: Request, res: Response) => {
  try {
    const bitbrowser = new BitBrowserService();
    const groups = await bitbrowser.getGroupList(0, 100);

    res.json({ data: groups });
  } catch (error) {
    logger.error('Failed to get groups:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

/**
 * 启动店铺登录任务
 */
router.post('/tasks/shop-login/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId || !shopId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 创建任务
    const taskResult = await require('../database/connection').query(
      `INSERT INTO tasks (user_id, shop_id, task_type, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, shopId, 'shop_login', 'pending']
    );

    const task = taskResult.rows[0];
    logger.info(`Created shop login task: ${task.id}`);

    // 异步执行任务
    setImmediate(async () => {
      try {
        const executor = new TaskExecutor();
        await executor.execute({
          taskId: task.id,
          shopId,
          taskType: 'shop_login'
        });
      } catch (error) {
        logger.error(`Task execution failed: ${task.id}`, error);
      }
    });

    res.status(201).json({
      data: task,
      message: 'Task created, please wait for login completion'
    });
  } catch (error) {
    logger.error('Failed to create login task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * 启动商品同步任务
 */
router.post('/tasks/product-sync/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const taskResult = await require('../database/connection').query(
      `INSERT INTO tasks (user_id, shop_id, task_type, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, shopId, 'product_sync', 'pending']
    );

    const task = taskResult.rows[0];

    // 异步执行任务
    setImmediate(async () => {
      try {
        const executor = new TaskExecutor();
        await executor.execute({
          taskId: task.id,
          shopId,
          taskType: 'product_sync'
        });
      } catch (error) {
        logger.error(`Task execution failed: ${task.id}`, error);
      }
    });

    res.status(201).json({ data: task });
  } catch (error) {
    logger.error('Failed to create product sync task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * 启动统计数据同步任务
 */
router.post('/tasks/stats-sync/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const taskResult = await require('../database/connection').query(
      `INSERT INTO tasks (user_id, shop_id, task_type, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, shopId, 'stats_sync', 'pending']
    );

    const task = taskResult.rows[0];

    // 异步执行任务
    setImmediate(async () => {
      try {
        const executor = new TaskExecutor();
        await executor.execute({
          taskId: task.id,
          shopId,
          taskType: 'stats_sync'
        });
      } catch (error) {
        logger.error(`Task execution failed: ${task.id}`, error);
      }
    });

    res.status(201).json({ data: task });
  } catch (error) {
    logger.error('Failed to create stats sync task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

export default router;
