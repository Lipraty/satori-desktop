import { ComponentType } from "react"

import { MessagingView } from "./Message"
import { ContactView } from "./Contact"
import { SettingsView } from "./Settings"
import { NetworksView } from "./Networks"

export interface View {
  icon?: string
  name: string
  sidebar?: boolean
  append?: boolean
  component: ComponentType
}

export const views: View[] = [
  {
    icon: 'ChatSparkle',
    name: 'Chat',
    sidebar: true,
    component: MessagingView
  },
  {
    icon: 'Person',
    name: 'Person',
    sidebar: true,
    component: ContactView
  },
  {
    name: 'Network',
    icon: 'PlugConnectedSettings',
    sidebar: true,
    component: NetworksView
  },
  {
    icon: 'Settings',
    name: 'Settings',
    sidebar: true,
    append: true,
    component: SettingsView
  }
]
