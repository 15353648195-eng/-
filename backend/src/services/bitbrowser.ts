import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

interface CreateBrowserParams {
  name?: string;
  remark?: string;
  groupId?: string;
  proxyMethod?: number;
  proxyType?: string;
  host?: string;
  port?: string;
  proxyUserName?: string;
  proxyPassword?: string;
  browserFingerPrint?: Record<string, any>;
}

interface OpenBrowserParams {
  id: string;
  args?: string[];
  loadExtensions?: boolean;
  extractIp?: boolean;
}

class BitBrowserService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://127.0.0.1:54345') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.response.use(
      response => {
        if (response.status === 200) {
          return response.data;
        }
        throw new Error('Request failed');
      },
      error => {
        logger.error('BitBrowser API error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 创建浏览器窗口
   */
  async createBrowser(params: CreateBrowserParams) {
    try {
      const data = {
        groupId: params.groupId || null,
        name: params.name || '',
        remark: params.remark || '',
        proxyMethod: params.proxyMethod || 2,
        proxyType: params.proxyType || 'noproxy',
        host: params.host || '',
        port: params.port || '',
        proxyUserName: params.proxyUserName || '',
        proxyPassword: params.proxyPassword || '',
        browserFingerPrint: params.browserFingerPrint || {}
      };

      const response = await this.client.post('/browser/update', data);

      if (response.success) {
        logger.info(`Browser created: ${response.data.id}`);
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to create browser');
      }
    } catch (error) {
      logger.error('Failed to create browser:', error);
      throw error;
    }
  }

  /**
   * 打开浏览器并返回WebSocket端点
   */
  async openBrowser(params: OpenBrowserParams) {
    try {
      const data = {
        id: params.id,
        args: params.args || [],
        loadExtensions: params.loadExtensions !== false,
        extractIp: params.extractIp === true
      };

      const response = await this.client.post('/browser/open', data);

      if (response.success) {
        logger.info(`Browser opened: ${params.id}`);
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to open browser');
      }
    } catch (error) {
      logger.error('Failed to open browser:', error);
      throw error;
    }
  }

  /**
   * 关闭浏览器
   */
  async closeBrowser(id: string) {
    try {
      const response = await this.client.post('/browser/close', { id });

      if (response.success) {
        logger.info(`Browser closed: ${id}`);
        return true;
      } else {
        throw new Error(response.msg || 'Failed to close browser');
      }
    } catch (error) {
      logger.error('Failed to close browser:', error);
      throw error;
    }
  }

  /**
   * 删除浏览器
   */
  async deleteBrowser(id: string) {
    try {
      const response = await this.client.post('/browser/delete', { id });

      if (response.success) {
        logger.info(`Browser deleted: ${id}`);
        return true;
      } else {
        throw new Error(response.msg || 'Failed to delete browser');
      }
    } catch (error) {
      logger.error('Failed to delete browser:', error);
      throw error;
    }
  }

  /**
   * 获取浏览器详情
   */
  async getBrowserDetail(id: string) {
    try {
      const response = await this.client.post('/browser/detail', { id });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to get browser detail');
      }
    } catch (error) {
      logger.error('Failed to get browser detail:', error);
      throw error;
    }
  }

  /**
   * 获取浏览器列表
   */
  async getBrowserList(page: number = 0, pageSize: number = 100, groupId?: string) {
    try {
      const data: any = { page, pageSize };
      if (groupId) {
        data.groupId = groupId;
      }

      const response = await this.client.post('/browser/list', data);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to get browser list');
      }
    } catch (error) {
      logger.error('Failed to get browser list:', error);
      throw error;
    }
  }

  /**
   * 获取浏览器简洁列表
   */
  async getBrowserConciseList(page: number = 0, pageSize: number = 100) {
    try {
      const response = await this.client.post('/browser/list/concise', {
        page,
        pageSize
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to get browser list');
      }
    } catch (error) {
      logger.error('Failed to get browser concise list:', error);
      throw error;
    }
  }

  /**
   * 修改浏览器信息（部分更新）
   */
  async updateBrowserPartial(id: string, updates: Record<string, any>) {
    try {
      const data = {
        ids: [id],
        ...updates
      };

      const response = await this.client.post('/browser/update/partial', data);

      if (response.success) {
        logger.info(`Browser updated: ${id}`);
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to update browser');
      }
    } catch (error) {
      logger.error('Failed to update browser:', error);
      throw error;
    }
  }

  /**
   * 添加分组
   */
  async addGroup(groupName: string, sortNum: number = 0) {
    try {
      const response = await this.client.post('/group/add', { groupName, sortNum });

      if (response.success) {
        logger.info(`Group added: ${groupName}`);
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to add group');
      }
    } catch (error) {
      logger.error('Failed to add group:', error);
      throw error;
    }
  }

  /**
   * 获取分组列表
   */
  async getGroupList(page: number = 0, pageSize: number = 100) {
    try {
      const response = await this.client.post('/group/list', { page, pageSize });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to get group list');
      }
    } catch (error) {
      logger.error('Failed to get group list:', error);
      throw error;
    }
  }

  /**
   * 健康检查 - 测试连接
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.post('/group/list', { page: 0, pageSize: 1 });
      return response.success === true;
    } catch (error) {
      logger.warn('BitBrowser health check failed:', error);
      return false;
    }
  }
}

export default BitBrowserService;
