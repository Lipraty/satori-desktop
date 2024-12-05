import { CardHeader, Subtitle2, CardPreview, Text, Body2, Body1 } from "@fluentui/react-components"
import { PropsWithChildren, ReactNode } from "react"

import { Icon, IconNames } from "../Icon"


export interface ExpansionPanelTitleProps extends PropsWithChildren {
  title: string | ReactNode
  subtitle?: string
  collapsedIcon?: IconNames
  expandedIcon?: IconNames
  selecred?: boolean
}

export interface ExpansionPanelContentProps extends PropsWithChildren {
  // size?: 'small' | 'medium' | 'large'
  _hidden?: boolean
  content?: string
}

export const _ExpansionPanelTitle = ({ title, selecred, subtitle }: ExpansionPanelTitleProps) => (
  <CardHeader
    style={{
      borderBottom: '1px solid var(--card-border-color)',
    }}
    header={<>
      <Body2>{title}</Body2>
      {subtitle && <Body1 style={{
        color: 'var(--colorNeutralForeground3)',
      }}>{subtitle}</Body1>}
    </>}
    action={<Icon name={selecred ? 'ChevronDown' : 'ChevronUp'} sized="20" />}
  />
)

export const _ExpansionPanelContent = ({ _hidden, children }: ExpansionPanelContentProps) => (
  <CardPreview
    style={{
      height: _hidden ? 0 : 'auto',
      overflow: 'hidden',
    }}>
    {children}
  </CardPreview>
)
