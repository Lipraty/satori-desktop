import { PropsWithChildren } from 'react'
import './style.scss'

interface ViewBoxProps {
  
}

export const ViewBox = (props: PropsWithChildren<ViewBoxProps>) => {
  return (
    <div className="main-view">
      <div className="main-view__context">{props.children}</div>
    </div>
  )
}
