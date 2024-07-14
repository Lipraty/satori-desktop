import { Children, cloneElement, CSSProperties, isValidElement, PropsWithChildren, useEffect, useState } from 'react'

import { ExpansionPanel, ExpansionPanelProps } from './ExpansionPanel'
import './style.scss'

export interface ExpansionPanelsProps {
  
  // props
  color?: string
  defaultIndex?: number | number[]
  disabled?: boolean  // TIP: This acting in the sub-components (ExpansionPanel)
  max?: number
  multiple?: boolean
  style?: CSSProperties
  className?: string
  // Events
  onToggle?: (index: number | number[]) => void
}

export const ExpansionPanels = (props: PropsWithChildren<ExpansionPanelsProps>) => {
  const {
    children,
    defaultIndex = -1,
    disabled,
    multiple = false,
    max = 0,
    onToggle,
  } = props

  const [expandedPanels, setExpandedPanels] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (defaultIndex !== undefined) {
      if (multiple && Array.isArray(defaultIndex)) {
        setExpandedPanels(defaultIndex.reduce((acc, index) => ({ ...acc, [index]: true }), {}))
      } else if (!multiple && typeof defaultIndex === 'number') {
        setExpandedPanels({ [defaultIndex]: true })
      }
    }
  }, [defaultIndex, multiple])

  const handleToggle = (index: number) => {
    setExpandedPanels((prevState) => {
      let newState;
      if (multiple) {
        newState = { ...prevState, [index]: !prevState[index] }
      } else {
        newState = { ...prevState, [index]: !prevState[index] }
        Object.keys(newState).forEach((key) => {
          if (parseInt(key) !== index) {
            newState[key] = false
          }
        })
      }
      if (onToggle) {
        const expandedIndices = Object.keys(newState)
          .filter((key) => newState[parseInt(key)])
          .map((key) => parseInt(key))
        onToggle(multiple ? expandedIndices : expandedIndices[0])
      }
      return newState
    })
  }

  return (
    <div className={`expansion-panels ${props.className}`} style={props.style}>
      {Children.map(children, (child, index) => {
        if (isValidElement(child) && (max !== 0 && index <= max)) {
          return cloneElement(child, {
            disabled,
            selected: !!expandedPanels[index],
            onToggle: () => handleToggle(index),
          } as Partial<ExpansionPanelProps>)
        }
        return child
      })}
    </div>
  )
}

export {
  ExpansionPanel,
}
