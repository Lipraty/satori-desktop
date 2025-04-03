import { Context } from './context'
import { } from '@shared/exposed'

export const root = new Context()

window.native.eventBridge((name, args) => {
  root.emit(name, ...args)
})

root.start()
