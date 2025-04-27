import { App } from 'vue'
import { ButtonDefinition, FluentDesignSystem, setTheme } from '@fluentui/web-components'
import { webDarkTheme, webLightTheme } from '@fluentui/tokens'

import Root from './root.vue'
import ViewBox from './view.vue'
import SystemBar from './systemBar.vue'
import Spacer from './spacer.vue'
import Icons from './icons'

export function install(app: App) {
  setTheme(webDarkTheme)
  ButtonDefinition.define(FluentDesignSystem.registry)

  app.component('satori-icons', Icons)
  app.component('satori-system-bar', SystemBar)
  app.component('satori-spacer', Spacer)
  app.component('satori-root', Root)
  app.component('satori-view', ViewBox)
}
