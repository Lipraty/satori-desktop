import { ReactElement } from "react"

import { MessagingView } from "./Meassaging"
import { ContactView } from "./Contact"
import { SettingsView } from "./Settings"

export interface View {
  icon?: string
  name: string
  sidebar?: boolean
  append?: boolean
  component: ReactElement
}

export const views: View[] = [
  {
    icon: 'Chat',
    name: 'Chat',
    sidebar: true,
    component: <MessagingView />
  },
  {
    icon: 'Person',
    name: 'Person',
    sidebar: true,
    component: <ContactView />
  },
  {
    icon: 'Settings',
    name: 'Settings',
    sidebar: true,
    append: true,
    component: <SettingsView />
  }
]
