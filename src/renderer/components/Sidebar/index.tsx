import './style.scss'
import { tokens } from '@fluentui/react-components'
import { memo, MouseEventHandler, ReactElement, ReactNode } from 'react'

import { Icon, IconNames } from '@renderer/components/Icon'

export const Sidebar = ({ children }: {
  children: ReactNode
}) => {
  return (
    <div className="sidebar">
      {children}
    </div>
  )
}

export interface SidebarItemProps {
  icon?: string
  label?: string
  active?: boolean
  children?: ReactElement
  onClick?: MouseEventHandler<HTMLDivElement>
}

Sidebar.Item = memo(({
  icon, label, active, children, onClick
}: SidebarItemProps) => {

  return (
    <div onClick={onClick} className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`} style={active ? {} : {}}>
      <div className="sidebar-item__indicator" style={{
        backgroundColor: tokens.colorNeutralForeground2BrandSelected
      }}></div>
      {children ?? <>
        {icon && <Icon name={icon as IconNames} filled={active} color={active ? tokens.colorNeutralForeground2BrandSelected : undefined} />}
        {!active && <span className="sidebar-item__label">{label}</span>}
      </>}
    </div >
  )
})

Sidebar.Divider = () => {
  return <div className="sidebar-item" style={{
    flex: 1,
    backgroundColor: 'transparent'
  }} />
}
