import { Context, Service } from 'cordis'
import { Notification, NotificationConstructorOptions } from 'electron'

declare module 'cordis' {
  interface Context {
    /**
   * Create a new system notification.
   * @param options
   * 
   * @example
   * ```ts
   * const notification = ctx.notification({
   *   title: 'Notification Title',
   *   body: 'Notification Body'
   * })
   * 
   * notification.show()
   * ```
   */
    notification: NotificationService
  }
}

export class NotificationService extends Service {
  static name = 'notification'

  constructor(ctx: Context) {
    super(ctx, 'notification')
  }

  [Service.invoke](options: NotificationConstructorOptions) {
    return new Notification(options)
  }
}

export interface NotificationService {
  (options: NotificationConstructorOptions): void
}

export default NotificationService
