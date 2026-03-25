import type { AppMessage } from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import { Service } from 'cordis'

declare module 'cordis' {
  interface Context {
    clientMessages: ClientMessagesService
  }
}

export class ClientMessagesService extends Service {
  static readonly inject = ['link']

  constructor(ctx: Context) {
    super(ctx, 'clientMessages', true)
  }

  private serializeMsg(msg: AppMessage): Record<string, unknown> {
    return { ...msg, seq: msg.seq.toString() }
  }

  async start() {
    const link = (this.ctx as any).link

    this.ctx.on('message/created', (msg: AppMessage) => {
      this.logger.debug('message/created → link.send: seq=%s platform=%s channelId=%s', msg.seq.toString(), msg.platform, msg.channelId)
      link.send('message.created', this.serializeMsg(msg))
    })

    this.logger.info('client-messages bridge started')
  }

  async stop() {}
}

export const name = 'client-messages'
export default ClientMessagesService
