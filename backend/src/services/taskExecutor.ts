import { query, queryOne } from '../database/connection';
import BitBrowserService from './bitbrowser';
import PinduoduoService from './pinduoduo';
import logger from '../utils/logger';

interface TaskConfig {
  taskId: string;
  shopId: string;
  taskType: 'shop_login' | 'product_sync' | 'stats_sync';
}

class TaskExecutor {
  private bitbrowser: BitBrowserService;

  constructor(bitbrowserUrl: string = 'http://127.0.0.1:54345') {
    this.bitbrowser = new BitBrowserService(bitbrowserUrl);
  }

  /**
   * 执行店铺登录任务
   */
  async executeShopLogin(config: TaskConfig) {
    const { taskId, shopId } = config;

    try {
      // 更新任务状态为运行中
      await query(
        'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['running', taskId]
      );

      // 检查比特浏览器是否可用
      const isAvailable = await this.bitbrowser.healthCheck();
      if (!isAvailable) {
        throw new Error('BitBrowser service is not available');
      }

      // 创建浏览器窗口
      const browserData = await this.bitbrowser.createBrowser({
        name: `Shop Login - ${shopId}`,
        remark: `Auto login for shop ${shopId}`,
        browserFingerPrint: {}
      });

      const browserId = browserData.id;
      logger.info(`Created browser: ${browserId}`);

      // 打开浏览器
      const openResult = await this.bitbrowser.openBrowser({
        id: browserId,
        loadExtensions: false,
        extractIp: false
      });

      const wsEndpoint = openResult.ws;
      logger.info(`Browser opened, WS endpoint: ${wsEndpoint}`);

      // 连接Puppeteer
      const pinduoduoService = new PinduoduoService(wsEndpoint);
      await pinduoduoService.connect();

      // 打开登录页面
      const page = await pinduoduoService.openLoginPage();

      // 等待用户登录（60秒超时）
      const shopInfo = await pinduoduoService.extractShopInfoAfterLogin(page, 60000);

      logger.info('Shop login successful:', shopInfo);

      // 更新数据库中的店铺信息
      await query(
        `UPDATE shops
         SET shop_name = $1,
             platform_shop_id = $2,
             account_name = $3,
             status = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [shopInfo.shopName, shopInfo.platformShopId, shopInfo.accountName, 'online', shopId]
      );

      // 更新任务状态为完成
      await query(
        `UPDATE tasks
         SET status = $1,
             result = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['completed', JSON.stringify(shopInfo), taskId]
      );

      // 清理
      await pinduoduoService.disconnect();
      await this.bitbrowser.closeBrowser(browserId);
      await this.bitbrowser.deleteBrowser(browserId);

      logger.info(`Task completed: ${taskId}`);
      return shopInfo;
    } catch (error) {
      logger.error(`Task failed: ${taskId}`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await query(
        `UPDATE tasks
         SET status = $1,
             error_message = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['failed', errorMessage, taskId]
      );

      throw error;
    }
  }

  /**
   * 执行商品同步任务
   */
  async executeProductSync(config: TaskConfig) {
    const { taskId, shopId } = config;

    try {
      await query(
        'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['running', taskId]
      );

      // 获取店铺信息
      const shop = await queryOne(
        'SELECT * FROM shops WHERE id = $1',
        [shopId]
      );

      if (!shop) {
        throw new Error('Shop not found');
      }

      // 创建浏览器窗口
      const browserData = await this.bitbrowser.createBrowser({
        name: `Product Sync - ${shopId}`,
        remark: `Auto product sync for shop ${shopId}`
      });

      // 打开浏览器
      const openResult = await this.bitbrowser.openBrowser({
        id: browserData.id
      });

      const pinduoduoService = new PinduoduoService(openResult.ws);
      await pinduoduoService.connect();

      // 获取商品列表
      const products = await pinduoduoService.getProductList();

      // 保存商品到数据库
      for (const product of products) {
        await query(
          `INSERT INTO products (shop_id, product_id, product_name, price, sales_count, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (shop_id, product_id)
           DO UPDATE SET
             product_name = $3,
             price = $4,
             sales_count = $5,
             updated_at = CURRENT_TIMESTAMP`,
          [
            shopId,
            product.productId,
            product.productName,
            product.price,
            product.salesCount,
            product.status
          ]
        );
      }

      // 更新任务状态
      await query(
        `UPDATE tasks
         SET status = $1,
             result = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['completed', JSON.stringify({ count: products.length }), taskId]
      );

      await pinduoduoService.disconnect();
      await this.bitbrowser.closeBrowser(browserData.id);

      logger.info(`Product sync completed: ${products.length} products`);
    } catch (error) {
      logger.error(`Product sync failed: ${taskId}`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await query(
        `UPDATE tasks
         SET status = $1,
             error_message = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['failed', errorMessage, taskId]
      );

      throw error;
    }
  }

  /**
   * 执行统计数据同步任务
   */
  async executeStatsSync(config: TaskConfig) {
    const { taskId, shopId } = config;

    try {
      await query(
        'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['running', taskId]
      );

      // 创建浏览器窗口
      const browserData = await this.bitbrowser.createBrowser({
        name: `Stats Sync - ${shopId}`,
        remark: `Auto stats sync for shop ${shopId}`
      });

      // 打开浏览器
      const openResult = await this.bitbrowser.openBrowser({
        id: browserData.id
      });

      const pinduoduoService = new PinduoduoService(openResult.ws);
      await pinduoduoService.connect();

      // 获取统计数据
      const stats = await pinduoduoService.getStatisticsData();

      // 保存统计数据
      const today = new Date().toISOString().split('T')[0];
      await query(
        `INSERT INTO statistics (shop_id, date, daily_sales, daily_orders, conversion_rate, page_views)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (shop_id, date)
         DO UPDATE SET
           daily_sales = $3,
           daily_orders = $4,
           conversion_rate = $5,
           page_views = $6,
           created_at = CURRENT_TIMESTAMP`,
        [
          shopId,
          today,
          stats.dailySales,
          stats.dailyOrders,
          stats.conversionRate,
          stats.pageViews
        ]
      );

      // 更新任务状态
      await query(
        `UPDATE tasks
         SET status = $1,
             result = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['completed', JSON.stringify(stats), taskId]
      );

      await pinduoduoService.disconnect();
      await this.bitbrowser.closeBrowser(browserData.id);

      logger.info(`Stats sync completed`);
    } catch (error) {
      logger.error(`Stats sync failed: ${taskId}`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await query(
        `UPDATE tasks
         SET status = $1,
             error_message = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['failed', errorMessage, taskId]
      );

      throw error;
    }
  }

  /**
   * 执行任务
   */
  async execute(config: TaskConfig) {
    logger.info(`Executing task: ${config.taskType} for shop ${config.shopId}`);

    switch (config.taskType) {
      case 'shop_login':
        return await this.executeShopLogin(config);
      case 'product_sync':
        return await this.executeProductSync(config);
      case 'stats_sync':
        return await this.executeStatsSync(config);
      default:
        throw new Error(`Unknown task type: ${config.taskType}`);
    }
  }
}

export default TaskExecutor;
