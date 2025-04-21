import { Context } from '@satoriapp/renderer'
import type { } from './preload'

const root = new Context()

root.start()

window.native.cordisEventBridge((name, args) => {
  console.log('event', name, args)
  root.emit(name, args as any)
})
