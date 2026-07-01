import type { AppMessage } from '@satoriapp/plugin-message'
import type { } from '@cordisjs/logger'
import type { Context } from 'cordis'
import { Service } from 'cordis'

declare module 'cordis' {
  interface Context {
    clientMessages: ClientMessagesService
  }
}

export class ClientMessagesService extends Service {
  static readonly inject = ['link', 'logger']

  constructor(ctx: Context) {
    super(ctx, 'clientMessages')
  }

  private serializeMsg(msg: AppMessage): Record<string, unknown> {
    return { ...msg, seq: msg.seq.toString() }
  }

  async* [Service.init]() {
    const off = this.ctx.on('message/created', (msg: AppMessage) => {
      this.ctx.logger('client-messages').debug('message/created → link/send: seq=%s platform=%s channelId=%s', msg.seq.toString(), msg.platform, msg.channelId)
      this.ctx.emit('link/send', 'message.created', this.serializeMsg(msg))
    })

    this.ctx.logger('client-messages').info('client-messages bridge started')

    yield () => off()
  }
}

export const name = 'client-messages'
export default ClientMessagesService
