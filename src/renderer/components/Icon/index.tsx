import * as FIcons from "@fluentui/react-icons"

type FluentIconsType = keyof typeof FIcons
type Filter<T, S extends string> = T extends `${infer N}${S}` ? N : T
type FilterNames = Filter<Filter<FluentIconsType, 'Filled' | 'Regular'>, '16' | '20' | '24' | '28' | '32' | '48'>

export interface IconProps {
  name: FilterNames
  size?: '16' | '20' | '24' | '28' | '32' | '48' | 'unsized'
  filled?: boolean
}

export const Icon: FIcons.FluentIcon = (props: IconProps) => {
  const { name, size = 'unsized', filled = false } = props
  const IconCompName = `${name}${size === 'unsized' ? '' : size}${filled ? 'Filled' : 'Regular'}`

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line import/namespace
  const IconComponent = (FIcons)[IconCompName]

  return <IconComponent />
}
