import { Context } from './context'

// clients
import RouterService from './plugins/router'
import home from './client/home'
import chat from './client/chat'

export * as Satori from '@satorijs/protocol'
export * from './context'
export * from './utils'
export * from './plugins/router'
export { ScopeStatus } from 'cordis'

export const root = new Context()
root.plugin(RouterService)
root.plugin(home)
root.plugin(chat)
