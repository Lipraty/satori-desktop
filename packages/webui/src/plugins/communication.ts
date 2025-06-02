import { Logger, Service } from 'cordis'
import { Context } from '@satoriapp/webui'

declare module '@satoriapp/webui' {
  interface Events {
    'communication/status': (status: CommunicationService.Status) => void
  }
  interface Context {
    communication: CommunicationService
  }
}

export class CommunicationService extends Service {
  private adapter: CommunicationAdapter
  private _baseUrl?: string | undefined

  constructor(public ctx: Context) {
    super(ctx, 'communication')
  }

  set baseUrl(url: string) {
    this._baseUrl = url
  }

  setAdapter(adapter: CommunicationAdapter) {
    if (this.adapter)
      this.adapter.dispose()

    this.adapter = adapter
    this.logger.info('adapter replaced')
  }
}

export namespace CommunicationService {
  export interface Config {
    baseUrl: string
  }

  export type Status = 'connecting' | 'connected' | 'disconnected' | 'error'
}

export type CommunicationEvent = 'action' | 'event' | 'upload' | 'download'

export interface CommunicationRequest<T = any> {
  id: string
  type: CommunicationEvent
  path: string
  payload: T
  headers?: Record<string, string>
}

export interface CommunicationResponse<T = any> {
  id: string
  data?: T
  error: { message: string; code?: string }
}

export abstract class CommunicationAdapter {
  protected eventListeners: Map<string, ((data: any) => void)[]> = new Map()
  protected requestPending: Map<string, (response: CommunicationResponse) => void> = new Map()
  protected logger: Logger

  constructor(public ctx: Context) {
    this.logger = ctx.logger('communication')
  }

  abstract action<T = any, R = any>(request: CommunicationRequest<R>): Promise<CommunicationResponse<T>>
  abstract addListener<T = any>(event: string, listener: (data: T) => void): void
  abstract send<T = any>(event: string, data: T): void
  abstract dispose(): boolean
}

export default CommunicationService
