import { io, Socket } from 'socket.io-client'

interface TaskUpdate {
  taskId: string
  status: string
  timestamp: string
  data?: any
}

interface ShopUpdate {
  eventType: string
  timestamp: string
  data?: any
}

interface DataSyncedEvent {
  shopId: string
  type: 'products' | 'statistics'
  count: number
  timestamp: string
}

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false

  connect(userId: string, serverUrl: string = 'http://localhost:3001') {
    if (this.socket?.connected) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        })

        this.socket.on('connect', () => {
          console.log('WebSocket connected')
          this.isConnected = true

          // 认证
          this.socket!.emit('authenticate', { userId })

          this.emit('connected', { timestamp: new Date() })
          resolve()
        })

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected')
          this.isConnected = false
          this.emit('disconnected', { timestamp: new Date() })
        })

        // 任务更新
        this.socket.on('task:update', (data: TaskUpdate) => {
          this.emit('task:update', data)
        })

        // 店铺更新
        this.socket.on('shop:update', (data: ShopUpdate) => {
          this.emit('shop:update', data)
        })

        // 数据同步完成
        this.socket.on('data:synced', (data: DataSyncedEvent) => {
          this.emit('data:synced', data)
        })

        // 错误处理
        this.socket.on('error', (error: any) => {
          console.error('WebSocket error:', error)
          this.emit('error', { error: error.message })
        })

        // 连接失败
        this.socket.on('connect_error', (error: any) => {
          console.error('WebSocket connection error:', error)
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  subscribeToShop(shopId: string) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:shop', { shopId })
    }
  }

  unsubscribeFromShop(shopId: string) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:shop', { shopId })
    }
  }

  on(eventName: string, callback: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName)!.add(callback)

    return () => {
      this.listeners.get(eventName)!.delete(callback)
    }
  }

  private emit(eventName: string, data?: any) {
    const callbacks = this.listeners.get(eventName)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in listener for ${eventName}:`, error)
        }
      })
    }
  }

  isConnectedFlag() {
    return this.isConnected
  }
}

export default new WebSocketService()
