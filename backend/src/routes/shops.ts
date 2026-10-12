import express, { Request, Response } from 'express';
import { query, queryOne } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

// 获取用户的所有店铺
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const result = await query(
      `SELECT s.*, sg.group_name
       FROM shops s
       LEFT JOIN shop_groups sg ON s.group_id = sg.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// 获取单个店铺详情
router.get('/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const shop = await queryOne(
      'SELECT * FROM shops WHERE id = $1',
      [shopId]
    );

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({ data: shop });
  } catch (error) {
    logger.error('Failed to fetch shop:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

// 添加新店铺
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { shopName, platformShopId, accountName, phone, ownerName, openDate, subjectInfo } = req.body;

    const result = await query(
      `INSERT INTO shops
       (user_id, shop_name, platform_shop_id, account_name, phone, owner_name, open_date, subject_info, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'online')
       RETURNING *`,
      [userId, shopName, platformShopId, accountName, phone, ownerName, openDate, subjectInfo]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    logger.error('Failed to create shop:', error);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// 更新店铺信息
router.put('/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { shopName, remark, status } = req.body;

    const result = await query(
      `UPDATE shops
       SET shop_name = COALESCE($2, shop_name),
           remark = COALESCE($3, remark),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [shopId, shopName, remark, status]
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    logger.error('Failed to update shop:', error);
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

// 删除店铺
router.delete('/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    await query('DELETE FROM shops WHERE id = $1', [shopId]);

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete shop:', error);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});

export default router;
