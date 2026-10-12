import puppeteer, { Browser, Page } from 'puppeteer';
import logger from '../utils/logger';

interface LoginResult {
  shopName: string;
  platformShopId: string;
  accountName: string;
  phone?: string;
  ownerName?: string;
  openDate?: string;
  subjectInfo?: string;
}

interface ProductData {
  productId: string;
  productName: string;
  price: number;
  salesCount: number;
  imageUrl?: string;
  status: string;
}

class PinduoduoService {
  private wsEndpoint: string;
  private browser: Browser | null = null;

  constructor(wsEndpoint: string) {
    this.wsEndpoint = wsEndpoint;
  }

  /**
   * 连接到浏览器
   */
  async connect() {
    try {
      this.browser = await puppeteer.connect({
        browserWSEndpoint: this.wsEndpoint,
        defaultViewport: null
      });
      logger.info('Connected to browser via Puppeteer');
      return true;
    } catch (error) {
      logger.error('Failed to connect to browser:', error);
      throw error;
    }
  }

  /**
   * 获取页面
   */
  private async getPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not connected');
    }

    const pages = await this.browser.pages();
    if (pages.length === 0) {
      throw new Error('No pages available');
    }

    return pages[0];
  }

  /**
   * 等待页面加载完成
   */
  private async waitForPageLoad(page: Page, timeout: number = 5000) {
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
    } catch (error) {
      // 如果超时，继续处理，可能已加载
      logger.warn('Page load timeout, continuing anyway');
    }
  }

  /**
   * 打开拼多多登录页面
   */
  async openLoginPage(): Promise<Page> {
    try {
      const page = await this.getPage();
      await page.goto('https://www.pddpro.com/login', {
        waitUntil: 'networkidle2'
      });
      logger.info('Opened PinDuoDuo login page');
      return page;
    } catch (error) {
      logger.error('Failed to open login page:', error);
      throw error;
    }
  }

  /**
   * 等待登录完成并提取店铺信息
   */
  async extractShopInfoAfterLogin(page: Page, timeout: number = 60000): Promise<LoginResult> {
    try {
      // 等待登录成功后跳转到首页或店铺页面
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });

      // 等待一段时间让页面完全加载
      await page.waitForTimeout(2000);

      // 提取店铺信息
      const shopInfo = await page.evaluate(() => {
        try {
          // 提取店铺名称
          const shopNameElement = document.querySelector(
            '[data-role="shop-name"],.shop-name,.shop-info-name'
          ) as HTMLElement;
          const shopName = shopNameElement?.innerText || '';

          // 提取平台店铺ID（可能在URL或页面元素中）
          const platformShopId = (window as any).shopId || '';

          // 提取账号名称
          const accountElement = document.querySelector(
            '.account-name,.user-name,.account-info'
          ) as HTMLElement;
          const accountName = accountElement?.innerText || '';

          return {
            shopName,
            platformShopId,
            accountName,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          return {
            shopName: '',
            platformShopId: '',
            accountName: '',
            error: 'Failed to extract shop info'
          };
        }
      });

      logger.info('Extracted shop info:', shopInfo);

      // 如果提取失败，尝试从其他地方获取
      if (!shopInfo.platformShopId) {
        const url = page.url();
        const shopIdMatch = url.match(/shop[_-]?id[=\/](\d+)/i);
        if (shopIdMatch) {
          shopInfo.platformShopId = shopIdMatch[1];
        }
      }

      return {
        shopName: shopInfo.shopName || 'Unknown Shop',
        platformShopId: shopInfo.platformShopId || '',
        accountName: shopInfo.accountName || '',
        phone: '',
        ownerName: '',
        openDate: '',
        subjectInfo: ''
      };
    } catch (error) {
      logger.error('Failed to extract shop info after login:', error);
      throw error;
    }
  }

  /**
   * 获取商品列表
   */
  async getProductList(page?: Page): Promise<ProductData[]> {
    try {
      if (!page) {
        page = await this.getPage();
      }

      // 导航到商品管理页面
      await page.goto('https://www.pddpro.com/goods/list', {
        waitUntil: 'networkidle2'
      });

      // 提取商品列表
      const products = await page.evaluate(() => {
        try {
          const productElements = document.querySelectorAll('[data-product-id], .product-item, tr[data-product-id]');
          const products: ProductData[] = [];

          productElements.forEach((element: any) => {
            const productId = element.getAttribute('data-product-id') || element.dataset.productId || '';
            const productName = element.querySelector('.product-name, [data-field="name"]')?.innerText || '';
            const priceText = element.querySelector('.product-price, [data-field="price"]')?.innerText || '0';
            const salesText = element.querySelector('.sales-count, [data-field="sales"]')?.innerText || '0';

            if (productId) {
              products.push({
                productId,
                productName,
                price: parseFloat(priceText.replace(/[^\d.]/g, '')) || 0,
                salesCount: parseInt(salesText.replace(/[^\d]/g, '')) || 0,
                imageUrl: element.querySelector('img')?.src || '',
                status: 'active'
              });
            }
          });

          return products;
        } catch (error) {
          return [];
        }
      });

      logger.info(`Extracted ${products.length} products`);
      return products;
    } catch (error) {
      logger.error('Failed to get product list:', error);
      throw error;
    }
  }

  /**
   * 获取统计数据
   */
  async getStatisticsData(page?: Page) {
    try {
      if (!page) {
        page = await this.getPage();
      }

      // 导航到数据概览页面
      await page.goto('https://www.pddpro.com/home/overview', {
        waitUntil: 'networkidle2'
      });

      // 提取统计数据
      const stats = await page.evaluate(() => {
        try {
          return {
            dailySales: parseFloat(
              document.querySelector('[data-stat="sales"], .stat-sales')?.innerText?.replace(/[^\d.]/g, '') || '0'
            ),
            dailyOrders: parseInt(
              document.querySelector('[data-stat="orders"], .stat-orders')?.innerText?.replace(/[^\d]/g, '') || '0'
            ),
            conversionRate: parseFloat(
              document.querySelector('[data-stat="conversion"], .stat-conversion')?.innerText?.replace(/[^\d.]/g, '') || '0'
            ),
            pageViews: parseInt(
              document.querySelector('[data-stat="views"], .stat-views')?.innerText?.replace(/[^\d]/g, '') || '0'
            )
          };
        } catch (error) {
          return {
            dailySales: 0,
            dailyOrders: 0,
            conversionRate: 0,
            pageViews: 0
          };
        }
      });

      logger.info('Extracted statistics:', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get statistics data:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.browser) {
      await this.browser.disconnect();
      this.browser = null;
      logger.info('Disconnected from browser');
    }
  }
}

export default PinduoduoService;
