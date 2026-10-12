import cron from 'node-cron';
import { query } from '../database/connection';
import logger from '../utils/logger';
import TaskExecutor from './taskExecutor';

interface ScheduledJob {
  id: string;
  name: string;
  shopId: string;
  taskType: 'shop_login' | 'product_sync' | 'stats_sync';
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  task?: cron.ScheduledTask;
}

class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private executor: TaskExecutor;

  constructor(bitbrowserUrl?: string) {
    this.executor = new TaskExecutor(bitbrowserUrl);
  }

  /**
   * 创建定时任务
   */
  createJob(shopId: string, taskType: string, cronExpression: string, name?: string): ScheduledJob {
    const jobId = `${shopId}-${taskType}-${Date.now()}`;

    const job: ScheduledJob = {
      id: jobId,
      name: name || `${taskType} for ${shopId}`,
      shopId,
      taskType: taskType as any,
      cronExpression,
      enabled: true
    };

    // 创建cron任务
    try {
      job.task = cron.schedule(cronExpression, async () => {
        await this.executeJob(job);
      });

      this.jobs.set(jobId, job);
      logger.info(`Scheduled job created: ${jobId}`);

      return job;
    } catch (error) {
      logger.error(`Failed to create scheduled job: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * 执行定时任务
   */
  private async executeJob(job: ScheduledJob) {
    logger.info(`Executing scheduled job: ${job.id}`);

    try {
      // 创建任务记录
      const taskResult = await query(
        `INSERT INTO tasks (shop_id, task_type, status)
         VALUES ($1, $2, 'pending')
         RETURNING *`,
        [job.shopId, job.taskType]
      );

      const taskId = taskResult.rows[0].id;

      // 异步执行任务
      setImmediate(async () => {
        try {
          await this.executor.execute({
            taskId,
            shopId: job.shopId,
            taskType: job.taskType
          });

          job.lastRun = new Date();
          logger.info(`Scheduled job completed: ${job.id}`);
        } catch (error) {
          logger.error(`Scheduled job failed: ${job.id}`, error);
        }
      });
    } catch (error) {
      logger.error(`Failed to execute scheduled job: ${job.id}`, error);
    }
  }

  /**
   * 删除定时任务
   */
  deleteJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job && job.task) {
      job.task.stop();
      job.task.destroy();
      this.jobs.delete(jobId);
      logger.info(`Scheduled job deleted: ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * 启用/禁用定时任务
   */
  toggleJob(jobId: string, enabled: boolean) {
    const job = this.jobs.get(jobId);
    if (job && job.task) {
      job.enabled = enabled;
      if (enabled) {
        job.task.start();
      } else {
        job.task.stop();
      }
      logger.info(`Scheduled job ${enabled ? 'enabled' : 'disabled'}: ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * 获取所有定时任务
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map(job => ({
      ...job,
      task: undefined // 不返回cron对象
    }));
  }

  /**
   * 获取店铺的定时任务
   */
  getShopJobs(shopId: string): ScheduledJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.shopId === shopId)
      .map(job => ({
        ...job,
        task: undefined
      }));
  }

  /**
   * 初始化预设定时任务
   */
  initializeDefaultJobs() {
    logger.info('Initializing default scheduled jobs');

    // 每天凌晨2点同步所有店铺的商品数据
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily product sync');
      try {
        const shops = await query('SELECT id FROM shops WHERE status = $1', ['online']);
        for (const shop of shops.rows) {
          await query(
            `INSERT INTO tasks (shop_id, task_type, status)
             VALUES ($1, $2, 'pending')`,
            [shop.id, 'product_sync']
          );
        }
      } catch (error) {
        logger.error('Daily product sync failed:', error);
      }
    });

    // 每小时同步一次统计数据
    cron.schedule('0 * * * *', async () => {
      logger.info('Running hourly stats sync');
      try {
        const shops = await query('SELECT id FROM shops WHERE status = $1', ['online']);
        for (const shop of shops.rows) {
          await query(
            `INSERT INTO tasks (shop_id, task_type, status)
             VALUES ($1, $2, 'pending')`,
            [shop.id, 'stats_sync']
          );
        }
      } catch (error) {
        logger.error('Hourly stats sync failed:', error);
      }
    });

    logger.info('Default scheduled jobs initialized');
  }

  /**
   * 停止所有定时任务
   */
  stopAll() {
    for (const job of this.jobs.values()) {
      if (job.task) {
        job.task.stop();
        job.task.destroy();
      }
    }
    this.jobs.clear();
    logger.info('All scheduled jobs stopped');
  }
}

export default SchedulerService;
