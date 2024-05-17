import './style.scss'
import { tokens } from '@fluentui/react-components'
import { MouseEventHandler, PropsWithChildren, ReactNode } from 'react'

import { Icon } from '../Icon'

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
      <div onClick={onClick} className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`} style={active ? {} : {}}>
        {active ? <div className="sidebar-item__indicator" /> : <></>}
        {icon}
        {!active ? <span className="sidebar-item__label">{label}</span> : <></>}
      </div >
    )
}

Sidebar.Divider = ()=>{
  return  <div className="sidebar-item" style={{
    flex: 1,
    backgroundColor: 'transparent'
  }} />
}
