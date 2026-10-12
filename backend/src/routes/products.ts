import express, { Request, Response } from 'express';
import { query, queryOne } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

// 获取店铺的商品列表
router.get('/shop/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    const offset = ((parseInt(page as string) || 1) - 1) * parseInt(pageSize as string || '50');

    // 验证店铺是否存在
    const shop = await queryOne('SELECT id FROM shops WHERE id = $1', [shopId]);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 获取总数
    const countResult = await query(
      'SELECT COUNT(*) as total FROM products WHERE shop_id = $1',
      [shopId]
    );

    // 获取商品列表
    const result = await query(
      `SELECT * FROM products
       WHERE shop_id = $1
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
      [shopId, pageSize, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page as string) || 1,
        pageSize: parseInt(pageSize as string) || 50
      }
    });
  } catch (error) {
    logger.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 获取单个商品详情
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await queryOne('SELECT * FROM products WHERE id = $1', [productId]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ data: product });
  } catch (error) {
    logger.error('Failed to fetch product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// 添加或更新商品
router.post('/', async (req: Request, res: Response) => {
  try {
    const { shopId, productId, productName, price, salesCount, status } = req.body;

    if (!shopId || !productId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await query(
      `INSERT INTO products (shop_id, product_id, product_name, price, sales_count, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (shop_id, product_id)
       DO UPDATE SET
         product_name = $3,
         price = $4,
         sales_count = $5,
         status = $6,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [shopId, productId, productName || '', price || 0, salesCount || 0, status || 'active']
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    logger.error('Failed to save product:', error);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// 删除商品
router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    await query('DELETE FROM products WHERE id = $1', [productId]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
