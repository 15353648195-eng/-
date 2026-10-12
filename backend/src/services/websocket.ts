import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../utils/logger';

interface UserConnection {
  userId: string;
  socket: Socket;
}

class WebSocketService {
  private io: SocketIOServer;
  private userConnections: Map<string, UserConnection> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`New WebSocket connection: ${socket.id}`);

      // 用户认证
      socket.on('authenticate', (data: { userId: string }) => {
        const { userId } = data;
        this.userConnections.set(userId, { userId, socket });
        socket.join(`user:${userId}`);
        logger.info(`User authenticated: ${userId}`);
      });

      // 订阅店铺事件
      socket.on('subscribe:shop', (data: { shopId: string }) => {
        socket.join(`shop:${data.shopId}`);
        logger.info(`Subscribed to shop: ${data.shopId}`);
      });

      // 取消订阅店铺事件
      socket.on('unsubscribe:shop', (data: { shopId: string }) => {
        socket.leave(`shop:${data.shopId}`);
      });

      // 断开连接
      socket.on('disconnect', () => {
        // 移除用户连接
        for (const [userId, conn] of this.userConnections.entries()) {
          if (conn.socket.id === socket.id) {
            this.userConnections.delete(userId);
            logger.info(`User disconnected: ${userId}`);
            break;
          }
        }
      });

      // 错误处理
      socket.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });
  }

  /**
   * 发送任务状态更新
   */
  notifyTaskUpdate(userId: string, taskId: string, status: string, data?: any) {
    this.io.to(`user:${userId}`).emit('task:update', {
      taskId,
      status,
      timestamp: new Date().toISOString(),
      data
    });

    logger.info(`Task update notified: ${taskId} -> ${status}`);
  }

  /**
   * 发送店铺相关更新
   */
  notifyShopUpdate(shopId: string, eventType: string, data?: any) {
    this.io.to(`shop:${shopId}`).emit('shop:update', {
      eventType,
      timestamp: new Date().toISOString(),
      data
    });

    logger.info(`Shop update notified: ${shopId} -> ${eventType}`);
  }

  /**
   * 发送数据同步完成
   */
  notifyDataSynced(userId: string, shopId: string, type: 'products' | 'statistics', count: number) {
    this.io.to(`user:${userId}`).emit('data:synced', {
      shopId,
      type,
      count,
      timestamp: new Date().toISOString()
    });

    logger.info(`Data synced notified: ${shopId} -> ${type} (${count})`);
  }

  /**
   * 广播通知（所有用户）
   */
  broadcast(eventType: string, data?: any) {
    this.io.emit(eventType, {
      timestamp: new Date().toISOString(),
      data
    });
  }

  /**
   * 获取连接统计
   */
  getStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      connectedUsers: this.userConnections.size,
      users: Array.from(this.userConnections.keys())
    };
  }

  /**
   * 关闭WebSocket服务
   */
  close() {
    this.io.close();
    logger.info('WebSocket service closed');
  }
}

export default WebSocketService;
