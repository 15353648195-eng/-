import express, { Request, Response } from 'express';
import { query } from '../database/connection';
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

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 创建任务
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { shopId, taskType } = req.body;

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

    res.json({ data: queryResult.rows[0] });
  } catch (error) {
    logger.error('Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;
