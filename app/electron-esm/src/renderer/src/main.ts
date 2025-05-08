import { root } from '@satoriapp/webui'

declare global {
  interface Window {
    api: {
      cordisEventBridge: (callback: (name: string, args: any) => void) => void
    }
  }
}

root.start()

window.api.cordisEventBridge((name, args) => {
  console.log('event', name, args)
  root.emit(name, args as any)
})
