import { useEffect, useRef, useCallback } from 'react'
import type { WebSocketMessage, CrawlStatus } from '../types'

interface UseWebSocketOptions {
  onCrawlStatus?: (status: CrawlStatus) => void
  onURLUpdate?: (url: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  
  // Store callbacks in refs to avoid recreating the connect function
  const callbacksRef = useRef(options)
  callbacksRef.current = options

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 
      (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace('http', 'ws') + '/api/ws'
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        reconnectAttempts.current = 0
        callbacksRef.current.onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          switch (message.type) {
            case 'crawl_status':
              callbacksRef.current.onCrawlStatus?.(message.payload as CrawlStatus)
              break
            case 'url_update':
              callbacksRef.current.onURLUpdate?.(message.payload)
              break
            default:
              // Unknown message type
              break
          }
        } catch {}
      }

      ws.onclose = (event) => {
        callbacksRef.current.onDisconnect?.()
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        callbacksRef.current.onError?.(error)
      }
    } catch {}
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    disconnect,
    connect
  }
} 