import * as FIcons from '@fluentui/react-icons'

type FluentIconsType = keyof typeof FIcons
type Filter<T, S extends string> = T extends `${infer N}${S}` ? N : T
export type IconNames = Filter<Filter<FluentIconsType, 'Filled' | 'Regular'>, '16' | '20' | '24' | '28' | '32' | '48'>

export interface IconProps {
  name: IconNames
  color?: string
  sized?: '16' | '20' | '24' | '28' | '32' | '48' | 'unsized'
  filled?: boolean
  bundle?: boolean
}

export const Icon = ({ name, color, sized = 'unsized', filled = false, bundle = false }: IconProps) => {

  const FilledIconName = `${name}${sized === 'unsized' ? '' : sized}Filled`
  const RegularIconName = `${name}${sized === 'unsized' ? '' : sized}Regular`


  if (bundle) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line import/namespace
    const FilledIcon: FIcons.FluentIcon = (FIcons)[FilledIconName as IconNames]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line import/namespace
    const RegularIcon: FIcons.FluentIcon = (FIcons)[RegularIconName as IconNames]

    const Bundle = FIcons.bundleIcon(FilledIcon, RegularIcon)

    return <Bundle style={{
      color,
    }} />
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line import/namespace
    const IconByFIcon: FIcons.FluentIcon = (FIcons)[filled ? FilledIconName : RegularIconName as IconNames]

    return <IconByFIcon style={{
      color,
    }} />
  }
}
