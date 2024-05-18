import * as FIcons from '@fluentui/react-icons'

type FluentIconsType = keyof typeof FIcons
type Filter<T, S extends string> = T extends `${infer N}${S}` ? N : T
export type IconNames = Filter<Filter<FluentIconsType, 'Filled' | 'Regular'>, '16' | '20' | '24' | '28' | '32' | '48'>

export interface IconProps {
  name: IconNames
  color?: string
  sized?: '16' | '20' | '24' | '28' | '32' | '48' | 'unsized'
  filled?: boolean
}

export const Icon = ({ name, color, sized = 'unsized', filled = false }: IconProps) => {

  const IconCompName = `${name}${sized === 'unsized' ? '' : sized}${filled ? 'Filled' : 'Regular'}`
  // @ts-ignore
  const IconByFIcon = (FIcons)[IconCompName as IconNames]

  // if (!IconByFIcon) return null
  return <IconByFIcon style={{
    color,
  }}/>
}
