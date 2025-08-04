import type { Context } from '@satoriapp/webui'
import { Communication } from '@satoriapp/webui'

export class IpcAdapter extends Communication.Adapter {
  constructor(public ctx: Context, channel: string) {
    super(ctx)
  }

  async action<T = any, R = any>(request: Communication.Request<R>): Promise<Communication.Response<T>> {

  }

  addListener<T = any>(event: string, listener: (data: T) => void): void {

  }

  send<T = any>(event: string, data: T): void {

  }

  dispose(): boolean {

  }
}
