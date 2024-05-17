import { ReactNode } from "react"
import { tokens } from '@fluentui/react-components'

export const SatoriDesktopColors = ({children}:{
  children: ReactNode
})=>{
  return <div style={{
    '--main': tokens.colorBrandBackground
  } as unknown}>
    {children}
  </div>
}