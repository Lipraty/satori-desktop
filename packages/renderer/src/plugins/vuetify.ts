import { Context } from '@satoriapp/renderer'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

declare module '@satoriapp/renderer' {
  interface Context {
    $vuetify: typeof createVuetify
  }
}

export default function (ctx: Context) {
  const vuetify = createVuetify({
    components,
    directives,
  })
  ctx.set('$vuetify', vuetify)
}
