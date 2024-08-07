import { PropsWithChildren } from 'react'
import './style.scss'

interface ViewBoxProps {
  col?: number | 'auto'
  fixed?: boolean
  width?: string | number
  rightRadius?: boolean
  style?: React.CSSProperties
  transparent?: boolean
}

export const ViewBox = ({ col, fixed, width, children, style = {}, rightRadius = false, transparent = false }: PropsWithChildren<ViewBoxProps>) => {
  let colStyle = {}

  if (!fixed) {
    if (!col || col !== 'auto' && (col < 1 || col > 12)) col = 'auto'

    colStyle = col === 'auto' ? {
      flex: '1 1 auto',
      maxWidth: '100%',
    } : {
      flex: `0 0 calc(${col} / 12 * 100%)`,
      maxWidth: `calc(${col} / 12 * 100%)`,
    }
  } else {
    colStyle = {
      width: width || 'auto',
      flex: '0 0 auto',
    }
  }

  return (
    <div className="main-view" style={Object.assign(colStyle, {
      borderTopRightRadius: rightRadius ? 'var(--borderRadiusLarge)' : '0',
      backgroundColor: transparent ? 'transparent' : '',
      border: transparent ? 'none' : '',
    })}>
      <div className="main-view__context" style={style}>{children}</div>
    </div>
  )
}
