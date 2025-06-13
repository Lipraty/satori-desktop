import { Logger, Service } from 'cordis'
import { Context } from '@satoriapp/webui'

declare module '@satoriapp/webui' {
  interface Events {
    'communication/status': (status: Communication.Status) => void
  }
  interface Context {
    communication: Communication
  }
}

export class Communication extends Service {
  private adapter: Communication.Adapter
  private point?: string | undefined

  constructor(public ctx: Context) {
    super(ctx, 'communication')
    this.init()
  }

  set baseUrl(url: string) {
    this.point = url
  }

  private async init() {
    if (!this.point) {
      this.logger.warn('connect point is not found.')
      return
    }
    this.logger.info(`connecting to ${this.point}`)
  }

  setAdapter(adapter: Communication.Adapter) {
    if (this.adapter)
      this.adapter.dispose()

    this.adapter = adapter
    this.logger.info('adapter replaced')
    this.init()
  }
}

export namespace Communication {
  export interface Config {
    baseUrl: string
  }

  export type Status = 'connecting' | 'connected' | 'disconnected' | 'error'

  export type Event = 'status' | 'action' | 'event' | 'upload' | 'download'

  export interface Request<T = any> {
    id: string
    type: Event
    path: string
    payload: T
    headers?: Record<string, string>
  }

  export interface Response<T = any> {
    id: string
    data?: T
    error: { message: string; code?: string }
  }

  export abstract class Adapter {
    protected eventListeners: Map<string, ((data: any) => void)[]> = new Map()
    protected requestPending: Map<string, (response: Response) => void> = new Map()
    protected logger: Logger

    constructor(public ctx: Context) {
      this.logger = ctx.logger('communication')
    }

    abstract action<T = any, R = any>(request: Request<R>): Promise<Response<T>>
    abstract addListener<T = any>(event: string, listener: (data: T) => void): void
    abstract send<T = any>(event: string, data: T): void
    abstract dispose(): boolean
  }
}

export default Communication
