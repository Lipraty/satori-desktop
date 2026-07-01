import type { Context } from 'cordis'
import type { LocaleMessageDictionary, VueMessageType } from 'vue-i18n'
import { Service } from 'cordis'
import { defineProperty } from 'cosmokit'
import { createI18n } from 'vue-i18n'

export default class I18nService {
  readonly i18n = createI18n({ legacy: false })

  constructor(public ctx: Context) {
    defineProperty(this, Service.tracker, { property: 'ctx' })
  }

  mergeLocaleMessage(locale: string, messages: LocaleMessageDictionary<VueMessageType>): void {
    this.i18n.global.mergeLocaleMessage(locale, messages)
  }
}
