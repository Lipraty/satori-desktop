import type { App } from 'vue'
import { ButtonDefinition, FluentDesignSystem } from '@fluentui/web-components'

import Card from './card.vue'
import Icons from './icons'
import Root from './root.vue'
import Spacer from './spacer.vue'
import SystemBar from './systemBar.vue'
import ViewBox from './view.vue'

export function install(app: App) {
  ButtonDefinition.define(FluentDesignSystem.registry)

  app.component('satori-icons', Icons)
  app.component('satori-system-bar', SystemBar)
  app.component('satori-spacer', Spacer)
  app.component('satori-root', Root)
  app.component('satori-view', ViewBox)
  app.component('satori-card', Card)
}
