
import { fluent } from "./definition"
// type FluentIconsType = keyof typeof FIcons
// type Filter<T, S extends string> = T extends `${infer N}${S}` ? N : T
// type FilterNames = Filter<Filter<FluentIconsType, 'Filled' | 'Regular'>, '16' | '20' | '24' | '28' | '32' | '48'>

export type IconNames = keyof typeof fluent
export interface IconProps {
  name: IconNames
}


export const Icon = ({
  name
}: IconProps) => {
  const Ico = fluent[name]

  return <Ico />
}
