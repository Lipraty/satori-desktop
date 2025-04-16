import { Context } from './context'
import type { } from '@satoriapp/preload'

const root = new Context()

window.native.cordisEventBridge((name, args) => {
  root.emit(name, ...args)
})

root.start()

export { useContext } from './context'
