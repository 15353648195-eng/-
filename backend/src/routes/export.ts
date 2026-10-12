import express, { Request, Response } from 'express';
import { query } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

/**
 * 导出店铺数据（CSV）
 */
router.get('/shops/csv', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const result = await query(
      `SELECT shop_name, platform_shop_id, account_name, status, remark, created_at
       FROM shops
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const csv = [
      ['店铺名称', '平台店铺ID', '账号名称', '状态', '备注', '创建时间'],
      ...result.rows.map(row => [
        row.shop_name,
        row.platform_shop_id,
        row.account_name,
        row.status,
        row.remark || '',
        new Date(row.created_at).toLocaleString('zh-CN')
      ])
    ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment;filename=shops_${Date.now()}.csv`);
    res.send('﻿' + csv);
  } catch (error) {
    logger.error('Failed to export shops:', error);
    res.status(500).json({ error: 'Failed to export shops' });
  }
});

/**
 * 导出商品数据（CSV）
 */
router.get('/products/csv', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ error: 'shopId required' });
    }

    const result = await query(
      `SELECT product_id, product_name, price, sales_count, status, updated_at
       FROM products
       WHERE shop_id = $1
       ORDER BY updated_at DESC`,
      [shopId]
    );

    const csv = [
      ['商品ID', '商品名称', '价格', '销量', '状态', '更新时间'],
      ...result.rows.map(row => [
        row.product_id,
        row.product_name,
        row.price.toFixed(2),
        row.sales_count,
        row.status,
        new Date(row.updated_at).toLocaleString('zh-CN')
      ])
    ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment;filename=products_${shopId}_${Date.now()}.csv`);
    res.send('﻿' + csv);
  } catch (error) {
    logger.error('Failed to export products:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
});

/**
 * 导出统计数据（CSV）
 */
router.get('/statistics/csv', async (req: Request, res: Response) => {
  try {
    const { shopId, startDate, endDate } = req.query;

    if (!shopId) {
      return res.status(400).json({ error: 'shopId required' });
    }

    let sql = `SELECT date, daily_sales, daily_orders, conversion_rate, page_views
               FROM statistics
               WHERE shop_id = $1`;
    const params: any[] = [shopId];

    if (startDate && endDate) {
      sql += ` AND date >= $${params.length + 1} AND date <= $${params.length + 2}`;
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY date DESC';

    const result = await query(sql, params);

    const csv = [
      ['日期', '销售额', '订单数', '转化率', '浏览量'],
      ...result.rows.map(row => [
        row.date,
        row.daily_sales.toFixed(2),
        row.daily_orders,
        row.conversion_rate.toFixed(2) + '%',
        row.page_views
      ])
    ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment;filename=statistics_${shopId}_${Date.now()}.csv`);
    res.send('﻿' + csv);
  } catch (error) {
    logger.error('Failed to export statistics:', error);
    res.status(500).json({ error: 'Failed to export statistics' });
  }
});

/**
 * 导出为JSON
 */
router.get('/shops/json', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const result = await query(
      `SELECT * FROM shops WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment;filename=shops_${Date.now()}.json`);
    res.json({ data: result.rows, exportTime: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to export shops as JSON:', error);
    res.status(500).json({ error: 'Failed to export shops' });
  }
});

export default router;
