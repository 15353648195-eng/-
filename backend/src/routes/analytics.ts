import express, { Request, Response } from 'express';
import { query } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

/**
 * 获取仪表板统计数据
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    // 店铺统计
    const shopsResult = await query(
      'SELECT COUNT(*) as total, status, COUNT(*) as count FROM shops WHERE user_id = $1 GROUP BY status',
      [userId]
    );

    // 商品统计
    const productsResult = await query(
      `SELECT COUNT(*) as total FROM products 
       WHERE shop_id IN (SELECT id FROM shops WHERE user_id = $1)`,
      [userId]
    );

    // 最近7天的销售数据
    const salesResult = await query(
      `SELECT SUM(daily_sales) as total_sales, SUM(daily_orders) as total_orders, 
              AVG(conversion_rate) as avg_conversion
       FROM statistics
       WHERE shop_id IN (SELECT id FROM shops WHERE user_id = $1)
       AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );

    // 待处理任务
    const tasksResult = await query(
      `SELECT COUNT(*) as total FROM tasks 
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    const shopStats = {};
    shopsResult.rows.forEach(row => {
      shopStats[row.status] = row.count;
    });

    res.json({
      data: {
        shops: {
          total: shopsResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0),
          ...shopStats
        },
        products: {
          total: parseInt(productsResult.rows[0]?.total || 0)
        },
        sales: {
          total_sales: salesResult.rows[0]?.total_sales || 0,
          total_orders: salesResult.rows[0]?.total_orders || 0,
          avg_conversion: salesResult.rows[0]?.avg_conversion || 0
        },
        tasks: {
          pending: parseInt(tasksResult.rows[0]?.total || 0)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * 获取销售趋势
 */
router.get('/sales-trend', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { days = 30 } = req.query;

    const result = await query(
      `SELECT date, SUM(daily_sales) as sales, SUM(daily_orders) as orders
       FROM statistics
       WHERE shop_id IN (SELECT id FROM shops WHERE user_id = $1)
       AND date >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY date
       ORDER BY date DESC`,
      [userId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch sales trend:', error);
    res.status(500).json({ error: 'Failed to fetch sales trend' });
  }
});

/**
 * 获取店铺排名（按销售额）
 */
router.get('/shop-ranking', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT s.id, s.shop_name, 
              SUM(st.daily_sales) as total_sales,
              SUM(st.daily_orders) as total_orders,
              AVG(st.conversion_rate) as avg_conversion,
              COUNT(p.id) as product_count
       FROM shops s
       LEFT JOIN statistics st ON s.id = st.shop_id
       LEFT JOIN products p ON s.id = p.shop_id
       WHERE s.user_id = $1
       GROUP BY s.id, s.shop_name
       ORDER BY total_sales DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch shop ranking:', error);
    res.status(500).json({ error: 'Failed to fetch shop ranking' });
  }
});

/**
 * 获取任务执行统计
 */
router.get('/task-stats', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const result = await query(
      `SELECT task_type, status, COUNT(*) as count
       FROM tasks
       WHERE user_id = $1
       GROUP BY task_type, status`,
      [userId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    logger.error('Failed to fetch task stats:', error);
    res.status(500).json({ error: 'Failed to fetch task stats' });
  }
});

export default router;
