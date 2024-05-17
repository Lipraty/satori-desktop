import './style.scss'
import { tokens } from '@fluentui/react-components'
import { PropsWithChildren } from 'react'

import { Icon, IconNames } from '../Icon'

interface SidebarProps { }

export const Sidebar = (props: PropsWithChildren<SidebarProps>) => {
  return (
    <div className="sidebar">
      {props.children}
    </div>
  )
}

interface SidebarItemProps {
  icon?: string
  label?: string
  active?: boolean
  spacer?: boolean
}

export const SidebarItem = (props: SidebarItemProps) => {
  console.log(props)
  if (props.spacer)
    return (
      <div className="sidebar-item" style={{
        flex: 1,
        backgroundColor: 'transparent'
      }}></div>
    )
  else
    return (
      <div className={`sidebar-item ${props.active ? 'sidebar-item-active' : ''}`} style={props.active ? {} : {}}>
        {props.active ? <div className="sidebar-item__indicator" style={{
          backgroundColor: tokens.colorNeutralForeground2BrandSelected
        }}></div> : <></>}
        {props.icon ? <Icon name={props.icon as IconNames} filled={props.active}/> : <></>}
        {!props.active ? <span className="sidebar-item__label">{props.label}</span> : <></>}
      </div >
    )
}
