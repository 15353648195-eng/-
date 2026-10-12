import { useEffect, useState } from 'react'
import websocketService from '../services/websocket'

export function useWebSocket(userId: string | undefined) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    websocketService.connect(userId).then(() => {
      setConnected(true)
      setError(null)
    }).catch((err) => {
      setError(err.message)
      setConnected(false)
    })

    const unsubscribeConnected = websocketService.on('connected', () => {
      setConnected(true)
    })

    const unsubscribeDisconnected = websocketService.on('disconnected', () => {
      setConnected(false)
    })

    const unsubscribeError = websocketService.on('error', (data: any) => {
      setError(data.error)
    })

    return () => {
      unsubscribeConnected()
      unsubscribeDisconnected()
      unsubscribeError()
      websocketService.disconnect()
    }
  }, [userId])

  return { connected, error }
}

export function useTaskUpdates(callback: (data: any) => void) {
  useEffect(() => {
    return websocketService.on('task:update', callback)
  }, [callback])
}

export function useDataSyncedUpdates(callback: (data: any) => void) {
  useEffect(() => {
    return websocketService.on('data:synced', callback)
  }, [callback])
}

export function useShopSubscription(shopId: string | undefined) {
  useEffect(() => {
    if (shopId) {
      websocketService.subscribeToShop(shopId)
      return () => websocketService.unsubscribeFromShop(shopId)
    }
  }, [shopId])
}
