import logger from '../utils/logger';
import { query, queryOne } from '../database/connection';
import TaskExecutor from './taskExecutor';

interface QueuedTask {
  id: string;
  shopId: string;
  taskType: 'shop_login' | 'product_sync' | 'stats_sync';
  userId: string;
  retryCount: number;
  maxRetries: number;
}

class TaskQueue {
  private queue: Map<string, QueuedTask> = new Map();
  private isProcessing = false;
  private processInterval = 1000; // 每秒检查一次
  private executor: TaskExecutor;

  constructor(bitbrowserUrl?: string) {
    this.executor = new TaskExecutor(bitbrowserUrl);
  }

  /**
   * 初始化队列 - 从数据库加载待处理任务
   */
  async initialize() {
    try {
      const pendingTasks = await query(
        `SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100`,
        []
      );

      for (const task of pendingTasks.rows) {
        this.queue.set(task.id, {
          id: task.id,
          shopId: task.shop_id,
          taskType: task.task_type,
          userId: task.user_id,
          retryCount: 0,
          maxRetries: 3
        });
      }

      logger.info(`Loaded ${pendingTasks.rows.length} pending tasks from database`);

      // 启动处理循环
      this.startProcessing();
    } catch (error) {
      logger.error('Failed to initialize task queue:', error);
    }
  }

  /**
   * 添加任务到队列
   */
  addTask(task: QueuedTask) {
    this.queue.set(task.id, {
      ...task,
      retryCount: 0,
      maxRetries: 3
    });

    logger.info(`Task added to queue: ${task.id}`);
  }

  /**
   * 启动处理循环
   */
  private startProcessing() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processNext();
  }

  /**
   * 处理下一个任务
   */
  private async processNext() {
    try {
      if (this.queue.size === 0) {
        // 队列为空，等待下一个检查
        setTimeout(() => this.processNext(), this.processInterval);
        return;
      }

      // 获取第一个任务
      const [taskId, task] = Array.from(this.queue.entries())[0];

      logger.info(`Processing task: ${taskId} (${task.taskType})`);

      try {
        // 执行任务
        await this.executor.execute({
          taskId,
          shopId: task.shopId,
          taskType: task.taskType
        });

        // 任务成功，从队列移除
        this.queue.delete(taskId);
        logger.info(`Task completed: ${taskId}`);
      } catch (error) {
        logger.error(`Task failed: ${taskId}`, error);

        // 重试逻辑
        task.retryCount++;

        if (task.retryCount < task.maxRetries) {
          logger.info(`Retrying task ${taskId} (attempt ${task.retryCount}/${task.maxRetries})`);
          // 更新任务状态为待重试
          await query(
            `UPDATE tasks SET status = $1 WHERE id = $2`,
            ['pending', taskId]
          );
        } else {
          // 达到最大重试次数，从队列移除
          this.queue.delete(taskId);
          logger.error(`Task failed after ${task.maxRetries} retries: ${taskId}`);
        }
      }

      // 继续处理下一个任务
      setTimeout(() => this.processNext(), this.processInterval);
    } catch (error) {
      logger.error('Error in processNext:', error);
      setTimeout(() => this.processNext(), this.processInterval);
    }
  }

  /**
   * 停止处理
   */
  stop() {
    this.isProcessing = false;
    logger.info('Task queue stopped');
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueSize: this.queue.size,
      isProcessing: this.isProcessing,
      tasks: Array.from(this.queue.values())
    };
  }
}

export default TaskQueue;
