import { root } from '@satoriapp/renderer'
import type { } from './preload'

console.log('?')
root.start()

window.native.cordisEventBridge((name, args) => {
  console.log('event', name, args)
  root.emit(name, args as any)
})
