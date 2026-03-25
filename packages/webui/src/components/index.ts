import type { App } from 'vue'

import Card from './card.vue'
import Icons from './icons'
import Root from './root.vue'
import Slot from './slot.vue'
import Spacer from './spacer.vue'
import SystemBar from './systemBar.vue'
import ViewBox from './view.vue'

export function install(app: App) {
  app.component('satori-icons', Icons)
  app.component('satori-system-bar', SystemBar)
  app.component('satori-spacer', Spacer)
  app.component('satori-root', Root)
  app.component('satori-view', ViewBox)
  app.component('satori-card', Card)
  app.component('satori-slot', Slot)
}
