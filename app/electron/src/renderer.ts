import { root } from '@satoriapp/webui'
import type { } from './preload'

root.start()

window.native.cordisEventBridge((name, args) => {
  console.log('event', name, args)
  root.emit(name, args as any)
})
