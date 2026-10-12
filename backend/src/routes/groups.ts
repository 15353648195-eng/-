import express, { Request, Response } from 'express';
import { query, queryOne } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

// 获取分组列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const result = await query(
      `SELECT * FROM shop_groups
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// 创建分组
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { groupName } = req.body;

    if (!groupName) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const result = await query(
      `INSERT INTO shop_groups (user_id, group_name)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, groupName]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Group already exists' });
    }
    logger.error('Failed to create group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// 更新分组
router.put('/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { groupName } = req.body;

    if (!groupName) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const result = await query(
      `UPDATE shop_groups
       SET group_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [groupName, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    logger.error('Failed to update group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// 删除分组
router.delete('/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    // 先将该分组的店铺移到默认分组
    await query(
      'UPDATE shops SET group_id = NULL WHERE group_id = $1',
      [groupId]
    );

    // 删除分组
    await query('DELETE FROM shop_groups WHERE id = $1', [groupId]);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// 获取分组中的店铺
router.get('/:groupId/shops', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const result = await query(
      `SELECT * FROM shops
       WHERE group_id = $1
       ORDER BY created_at DESC`,
      [groupId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch shops in group:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

export default router;
