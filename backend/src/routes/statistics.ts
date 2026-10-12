import express, { Request, Response } from 'express';
import { query, queryOne } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

// 获取店铺的统计数据
router.get('/shop/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate } = req.query;

    // 验证店铺是否存在
    const shop = await queryOne('SELECT id FROM shops WHERE id = $1', [shopId]);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    let sql = 'SELECT * FROM statistics WHERE shop_id = $1';
    const params: any[] = [shopId];

    if (startDate && endDate) {
      sql += ` AND date >= $${params.length + 1} AND date <= $${params.length + 2}`;
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY date DESC';

    const result = await query(sql, params);

    // 计算统计数据
    const stats = result.rows;
    const summary = {
      totalSales: stats.reduce((sum: number, s: any) => sum + (s.daily_sales || 0), 0),
      totalOrders: stats.reduce((sum: number, s: any) => sum + (s.daily_orders || 0), 0),
      avgConversion: stats.length > 0
        ? parseFloat((stats.reduce((sum: number, s: any) => sum + (s.conversion_rate || 0), 0) / stats.length).toFixed(2))
        : 0,
      totalPageViews: stats.reduce((sum: number, s: any) => sum + (s.page_views || 0), 0)
    };

    res.json({
      data: stats,
      summary
    });
  } catch (error) {
    logger.error('Failed to fetch statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 获取单个统计记录
router.get('/:statsId', async (req: Request, res: Response) => {
  try {
    const { statsId } = req.params;
    const stats = await queryOne('SELECT * FROM statistics WHERE id = $1', [statsId]);

    if (!stats) {
      return res.status(404).json({ error: 'Statistics not found' });
    }

    res.json({ data: stats });
  } catch (error) {
    logger.error('Failed to fetch statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 添加或更新统计数据
router.post('/', async (req: Request, res: Response) => {
  try {
    const { shopId, date, dailySales, dailyOrders, conversionRate, pageViews } = req.body;

    if (!shopId || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await query(
      `INSERT INTO statistics (shop_id, date, daily_sales, daily_orders, conversion_rate, page_views)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (shop_id, date)
       DO UPDATE SET
         daily_sales = $3,
         daily_orders = $4,
         conversion_rate = $5,
         page_views = $6,
         created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [shopId, date, dailySales || 0, dailyOrders || 0, conversionRate || 0, pageViews || 0]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    logger.error('Failed to save statistics:', error);
    res.status(500).json({ error: 'Failed to save statistics' });
  }
});

// 获取多店铺比较数据
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { shopIds, startDate, endDate } = req.body;

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return res.status(400).json({ error: 'Invalid shop IDs' });
    }

    const placeholders = shopIds.map((_, i) => `$${i + 1}`).join(',');
    const params = [...shopIds];

    let sql = `
      SELECT shop_id,
             SUM(daily_sales) as total_sales,
             SUM(daily_orders) as total_orders,
             AVG(conversion_rate) as avg_conversion,
             SUM(page_views) as total_page_views
      FROM statistics
      WHERE shop_id IN (${placeholders})
    `;

    if (startDate && endDate) {
      sql += ` AND date >= $${params.length + 1} AND date <= $${params.length + 2}`;
      params.push(startDate, endDate);
    }

    sql += ' GROUP BY shop_id ORDER BY total_sales DESC';

    const result = await query(sql, params);

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch comparison statistics:', error);
    res.status(500).json({ error: 'Failed to fetch comparison statistics' });
  }
});

export default router;
