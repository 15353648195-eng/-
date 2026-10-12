import express, { Request, Response } from 'express';
import logger from '../utils/logger';

const router = express.Router();
let schedulerService: any; // 将由主应用注入

/**
 * 设置scheduler服务（由主应用调用）
 */
export function setScheduler(scheduler: any) {
  schedulerService = scheduler;
}

// 获取所有定时任务
router.get('/', (req: Request, res: Response) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const jobs = schedulerService.getAllJobs();
    res.json({ data: jobs });
  } catch (error) {
    logger.error('Failed to fetch scheduled jobs:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled jobs' });
  }
});

// 获取店铺的定时任务
router.get('/shop/:shopId', (req: Request, res: Response) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { shopId } = req.params;
    const jobs = schedulerService.getShopJobs(shopId);
    res.json({ data: jobs });
  } catch (error) {
    logger.error('Failed to fetch shop scheduled jobs:', error);
    res.status(500).json({ error: 'Failed to fetch shop scheduled jobs' });
  }
});

// 创建定时任务
router.post('/', (req: Request, res: Response) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { shopId, taskType, cronExpression, name } = req.body;

    if (!shopId || !taskType || !cronExpression) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const job = schedulerService.createJob(shopId, taskType, cronExpression, name);
    res.status(201).json({ data: job });
  } catch (error) {
    logger.error('Failed to create scheduled job:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create scheduled job' });
  }
});

// 启用/禁用定时任务
router.put('/:jobId', (req: Request, res: Response) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled parameter must be boolean' });
    }

    const success = schedulerService.toggleJob(jobId, enabled);

    if (success) {
      res.json({ message: `Job ${enabled ? 'enabled' : 'disabled'}` });
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (error) {
    logger.error('Failed to toggle scheduled job:', error);
    res.status(500).json({ error: 'Failed to toggle scheduled job' });
  }
});

// 删除定时任务
router.delete('/:jobId', (req: Request, res: Response) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    const success = schedulerService.deleteJob(jobId);

    if (success) {
      res.json({ message: 'Job deleted successfully' });
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (error) {
    logger.error('Failed to delete scheduled job:', error);
    res.status(500).json({ error: 'Failed to delete scheduled job' });
  }
});

export default router;
