import { createElement, ReactNode } from "react"
import { Card } from "@fluentui/react-components"

import { _ExpansionPanelTitle, _ExpansionPanelContent, ExpansionPanelTitleProps, ExpansionPanelContentProps } from "./ExpansionPanelComponents"

interface _OrignalProps {
  title: string
  content?: string | typeof _ExpansionPanelContent
  subtitle?: string
  icon?: string
  image?: string
  selected?: boolean
  color?: string
  disabled?: boolean
  // Card component orignal props
  appearance?: 'default' | 'outline' | 'filled' | 'filled-alternative' | 'subtle'
  focusMode?: 'off' | 'no-tab' | 'tab-exit' | 'tab-only'
  size?: 'small' | 'medium' | 'large'
}

export type ExpansionPanelProps = ExpansionPanelTitleProps & ExpansionPanelContentProps & _OrignalProps

export const ExpansionPanel = (props: ExpansionPanelProps) => {
  const { children, selected = true, color, disabled, size = 'medium', title, content } = props

  return (
    <Card
    className={`expansion-panel ${selected ? 'expansion-selected' : ''} ${disabled ? 'disabled' : ''} ${size}`}
    style={{
      backgroundColor: color,
      boxShadow: 'none',
    }}
    onClick={()=>{}}>
      <_ExpansionPanelTitle title={title} collapsedIcon={props.collapsedIcon} expandedIcon={props.expandedIcon} selecred={selected} />
      {selected && <div className="expansion-panel__line" />}
      {
        content
          ? (typeof content === 'string'
            ? <_ExpansionPanelContent content={content} />
            : createElement(content, props))
          : (children)
      }
    </Card>
  )
}

ExpansionPanel.Title = _ExpansionPanelTitle

ExpansionPanel.Content = _ExpansionPanelContent
