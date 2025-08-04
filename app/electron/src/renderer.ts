import type { } from './preload'
import { root } from '@satoriapp/webui'

root.start()

window.native.cordisEventBridge((name, args) => {
  console.log('event', name, args)
  root.emit(name, args as any)
})
