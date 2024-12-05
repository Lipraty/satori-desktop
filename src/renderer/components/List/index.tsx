import { createElement, MouseEventHandler } from 'react'
import { Avatar } from '@fluentui/react-components'

import { Icon, IconNames } from '@renderer/components/Icon'

import './style.scss'

export interface ListProps {
  line?: 'one' | 'two' | 'three'
  children?: React.ReactNode
  style?: React.CSSProperties
}

export const List = ({ line = 'one', children, style }: ListProps) => {
  return (
    <ul className={['list', `list--${line}-line`].join(' ')} style={style}>
      {children}
    </ul>
  )
}

export interface ListSubheaderProps {
  title: string
  children?: React.ReactElement
}

List.Subheader = ({ title }: ListSubheaderProps) => <>
  <li className="list-subheader">
    <h3 className='list-subheader__title'>{title}</h3>
  </li>
</>

export interface ListItemProps {
  as?: 'li' | 'div'
  key?: string
  title?: string
  subtitle?: string
  selected?: boolean
  avatar?: string | boolean
  icon?: IconNames
  iconAppend?: IconNames
  children?: React.ReactElement
  onClick?: MouseEventHandler<HTMLLIElement>
}

List.Item = ({ as, key, title, subtitle, selected = false, avatar, icon, iconAppend, children }: ListItemProps) => {
  const childrenComp: React.ReactElement[] = []
  const classList = ['list-item']
  as ??= 'li'

  if (title) childrenComp.push(<h3 className="list-item__title">{title}</h3>)
  if (!subtitle && children)
    childrenComp.push(children)
  else
    if (subtitle) childrenComp.push(<p className="list-item__subtitle">{subtitle}</p>)

  if (selected) classList.push('list-item--selected')

  return createElement(as, { key, className: classList.join(' ') }, <>
    {(icon && !avatar) && <Icon name={icon} sized="24" />}
    {(avatar && !icon) && <Avatar name={title} image={typeof avatar === 'string' ? { src: avatar } : undefined} size={40} />}
    <div className="list-item__content">
      {childrenComp}
    </div>
    {iconAppend && <Icon name={iconAppend} sized="24" />}
  </>)
}
