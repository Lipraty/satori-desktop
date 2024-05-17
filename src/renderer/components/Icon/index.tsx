import * as FIcons from "@fluentui/react-icons"

type FluentIconsType = keyof typeof FIcons
type Filter<T, S extends string> = T extends `${infer N}${S}` ? N : T
export type IconNames = Filter<Filter<FluentIconsType, 'Filled' | 'Regular'>, '16' | '20' | '24' | '28' | '32' | '48'>

export interface IconProps {
  name: IconNames
  sized?: '16' | '20' | '24' | '28' | '32' | '48' | 'unsized'
  filled?: boolean
}

export const Icon = (props: IconProps) => {
  const { name, sized = 'unsized', filled = false } = props

  const IconCompName = `${name[0].toUpperCase()}${name.slice(1)}${sized === 'unsized' ? '' : sized}${filled ? 'Filled' : 'Regular'}`

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line import/namespace
  const IconComponent = (FIcons)[IconCompName]

  if (!IconComponent) return null

  return <IconComponent />
}
