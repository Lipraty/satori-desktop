import type { Context } from '@satoriapp/webui'
import { Communication } from '@satoriapp/webui'

export class WebAdapter extends Communication.Adapter {
  private ws: WebSocket | null = null
  private baseUrl: string
  private retryCount: number = 0
  private maxRetries: number = 5
  private retryDelay: number = 1000 // milliseconds

  constructor(public ctx: Context, baseUrl: string) {
    super(ctx)
    this.baseUrl = baseUrl
    this.connectWebSocket()
  }

  private connectWebSocket() {
    this.ctx.emit('communication/status', 'connecting')
    const wsBase = this.baseUrl.replace(/^https?/, 'ws')
    this.ws = new WebSocket(wsBase)
    this.ws.onopen = () => {
      this.ctx.emit('communication/status', 'connected')
    }
    this.ws.onclose = () => {
      this.ctx.emit('communication/status', 'disconnected')
      this.logger.warn('WebSocket connection closed, attempting to reconnect...')
      this.retryCount++
      if (this.retryCount <= this.maxRetries) {
        setTimeout(() => {
          this.connectWebSocket()
        }, this.retryDelay)
      }
      else {
        this.ctx.emit('communication/status', 'error')
        this.logger.error('Max retries reached, giving up on WebSocket connection')
      }
    }
    this.ws.onerror = (error) => {
      this.logger.error('WebSocket error:', error)
    }
    this.ws.onmessage = (event) => {
      const response: Communication.Response = JSON.parse(event.data)
      const pendingRequest = this.requestPending.get(response.id)
      if (pendingRequest) {
        pendingRequest(response)
        this.requestPending.delete(response.id)
      }
      else {
        const listeners = this.eventListeners.get(response.id) || []
        for (const listener of listeners) {
          listener(response.data)
        }
      }
    }
  }

  async action<T = any, R = any>(request: Communication.Request<R>): Promise<Communication.Response<T>> {
    if (request.type === 'action') {
      try {
        const res = await fetch(`${this.baseUrl}${request.path}`, {
          method: request.headers?.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: JSON.stringify(request.payload),
        })
      }
      catch (error) {
        return {
          id: request.id,
          data: undefined,
          error: {
            code: 'ENOENT',
            message: `Action failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        }
      }
    }
  }

  addListener<T = any>(event: string, listener: (data: T) => void): void {

  }

  send<T = any>(event: string, data: T): void {

  }

  dispose(): boolean {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.logger.info('WebSocket connection closed')
      return true
    }
    return false
  }
}
