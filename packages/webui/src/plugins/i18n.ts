import type { Context } from '@satoriapp/webui'
import { Service } from 'cordis'
import { createI18n } from 'vue-i18n'

declare module '@satoriapp/webui' {
  interface Context {
    $i18n: I18nService
  }
}

export default class I18nService extends Service<never, Context> {
  readonly i18n = createI18n({ legacy: false })

  constructor(ctx: Context) {
    super(ctx, '$i18n', true)
  }

  mergeLocaleMessage(locale: string, messages: Record<string, unknown>): void {
    (this.i18n.global as any).mergeLocaleMessage(locale, messages)
  }
}
