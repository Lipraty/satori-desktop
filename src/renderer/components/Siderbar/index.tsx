import './style.scss'
import { tokens } from '@fluentui/react-components'
import { MouseEventHandler, PropsWithChildren, ReactNode } from 'react'

import { Icon, IconNames } from '../Icon'

export const Sidebar = ({ children }: {
  children: ReactNode
}) => {
  return (
    <div className="sidebar">
      {children}
    </div>
  )
}

interface SidebarItemProps {
  icon?: ReactNode
  label?: string
  active?: boolean
  onClick: MouseEventHandler<HTMLDivElement>
}

Sidebar.Item = ({
  icon, label, active, onClick
}: SidebarItemProps) => {

    return (
      <div onClick={onClick} className={`sidebar-item ${props.active ? 'sidebar-item-active' : ''}`} style={props.active ? {} : {}}>
        {props.active && <div className="sidebar-item__indicator" style={{
          backgroundColor: tokens.colorNeutralForeground2BrandSelected
        }}></div>}
        {props.icon && <Icon name={props.icon as IconNames} filled={props.active}/>}
        {!props.active && <span className="sidebar-item__label">{props.label}</span>}
      </div >
    )
}

Sidebar.Divider = ()=>{
  return  <div className="sidebar-item" style={{
    flex: 1,
    backgroundColor: 'transparent'
  }} />
}
