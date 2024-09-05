import { Notification } from 'electron'

import { Context, Service } from '@main'

// declare module '@shared' {

// }
declare module '@main' {
  interface Events {
    'notifier/created': (n: Notification, o: NotifierService.Options) => void
  }
}

export namespace NotifierService {
  export interface Options {
    type?: 'primary' | 'success' | 'warning' | 'danger'
    title: string
    content: string
  }
}

export class NotifierService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'notifier')
  }

  create(options: NotifierService.Options) {
    const notifier = new Notification({
      title: options.title,
      body: options.content,
    })
    this.ctx.emit('notifier/created', notifier, options)
    notifier.show()
  }
}
