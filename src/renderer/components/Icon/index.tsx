type FluentIconsType = keyof typeof FIcons
type Filter<T, S extends string> = T extends `${infer N}${S}` ? N : T
export type IconNames = Filter<Filter<FluentIconsType, 'Filled' | 'Regular'>, '16' | '20' | '24' | '28' | '32' | '48'>

export type IconNames = keyof typeof fluent
export interface IconProps {
  name: IconNames
  sized?: '16' | '20' | '24' | '28' | '32' | '48' | 'unsized'
  filled?: boolean
}

export const Icon = (props: IconProps) => {
  const { name, sized = 'unsized', filled = false } = props

  const IconCompName = `${name[0].toUpperCase()}${name.slice(1)}${sized === 'unsized' ? '' : sized}${filled ? 'Filled' : 'Regular'}`

export const Icon = ({
  name
}: IconProps) => {
  const Ico = fluent[name]

  if (!IconComponent) return null

  return <IconComponent />
}
