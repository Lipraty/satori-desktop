import { Avatar } from '@fluentui/react-components'

import { Icon, IconNames, } from '../Icon'
import './style.scss'

export interface ListProps {
  line?: 'one' | 'two' | 'three'
  children?: React.ReactNode
  style?: React.CSSProperties
}

export const List = (props: ListProps) => {
  const { line = 'one', children, style } = props

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

export const ListSubheader = (props: ListSubheaderProps) => { }

export interface ListItemProps {
  title?: string
  subtitle?: string
  selected?: boolean
  avatar?: string | boolean
  icon?: IconNames
  iconAppend?: IconNames
  children?: React.ReactElement
}

export const ListItem = (props: ListItemProps) => {
  const { title, subtitle, selected = false, avatar, icon, iconAppend, children } = props

  const childrenComp: React.ReactElement[] = []
  const classList = ['list-item']

  if (title) childrenComp.push(<h3 className="list-item__title">{title}</h3>)
  if (!subtitle)
    childrenComp.push(children)
  else
    if (subtitle) childrenComp.push(<p className="list-item__subtitle">{subtitle}</p>)

  if (selected) classList.push('list-item--selected')

  return (
    <li className={classList.join(' ')}>
      {(icon && !avatar) && <Icon name={icon} sized="24" />}
      {(avatar && !icon) && <Avatar name={title} image={typeof avatar === 'string' && {src: avatar}} size={40}/>}
      <div className="list-item__content">
        {childrenComp}
      </div>
      {iconAppend && <Icon name={iconAppend} sized="24" />}
    </li>
  )
}
