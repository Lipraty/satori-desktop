import './style.scss'
import { tokens } from '@fluentui/react-components'
import { PropsWithChildren } from 'react'

import { Icon } from '../Icon'

interface SidebarProps { }

export const Sidebar = ({ children }: PropsWithChildren<SidebarProps>) => {
  return (
    <div className="sidebar">
      {children}
    </div>
  )
}

interface SidebarItemProps {
  icon?: string
  label?: string
  active?: boolean
  spacer?: boolean
}

Sidebar.Item = ({
  icon, label, active, spacer
}: SidebarItemProps) => {
  if (spacer)
    return (
      <div className="sidebar-item" style={{
        flex: 1,
        backgroundColor: 'transparent'
      }}></div>
    )
  else
    return (
      <div className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`} style={active ? {} : {}}>
        {active ? <div className="sidebar-item__indicator" /> : <></>}
        {icon ? <Icon name={icon} filled={active}/> : <></>}
        {!active ? <span className="sidebar-item__label">{label}</span> : <></>}
      </div >
    )
}
