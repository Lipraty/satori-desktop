import './style.scss'
import { tokens } from '@fluentui/react-components'
import { CircleRegular } from '@fluentui/react-icons'
import { cloneElement, PropsWithChildren } from 'react'

interface SidebarProps { }

export const Sidebar = (props: PropsWithChildren<SidebarProps>) => {
  return (
    <div className="sidebar">
      {props.children}
    </div>
  )
}

interface SidebarItemProps {
  icon?: React.ReactElement
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

        {props.icon ? cloneElement(props.icon, {
          className: "sidebar-item__icon",
          style: {
            color: props.active ? tokens.colorNeutralForeground2BrandSelected : ''
          }
        }) : <CircleRegular />}
        {!props.active ? <span className="sidebar-item__label">{props.label}</span> : <></>}
      </div >
    )
}
