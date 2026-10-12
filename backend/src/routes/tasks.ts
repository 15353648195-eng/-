import express, { Request, Response } from 'express';
import { query, queryOne } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

// 获取任务列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { status, shopId } = req.query;

    let sql = 'SELECT * FROM tasks WHERE user_id = $1';
    const params: any[] = [userId];

    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (shopId) {
      sql += ` AND shop_id = $${params.length + 1}`;
      params.push(shopId);
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 获取单个任务详情
router.get('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await queryOne('SELECT * FROM tasks WHERE id = $1', [taskId]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ data: task });
  } catch (error) {
    logger.error('Failed to fetch task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// 创建任务
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { shopId, taskType } = req.body;

    if (!shopId || !taskType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await query(
      `INSERT INTO tasks (user_id, shop_id, task_type, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [userId, shopId, taskType]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    logger.error('Failed to create task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 更新任务状态
router.put('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, result, errorMessage } = req.body;

    const queryResult = await query(
      `UPDATE tasks
       SET status = $2,
           result = COALESCE($3, result),
           error_message = COALESCE($4, error_message),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [taskId, status, result, errorMessage]
    );

    if (queryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ data: queryResult.rows[0] });
  } catch (error) {
    logger.error('Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;
