import { Context } from './context'
import chat from './client/chat'
import home from './client/home'

export * as Satori from '@satorijs/protocol'
export * from './context'
export * from './utils'
export * from './plugins/router'
export { ScopeStatus } from 'cordis'

export const root = new Context()

root.plugin(home)
root.plugin(chat)
