import { Context } from './context'

import person from './client/person'
import message from './client/messages'
import network from './client/network'
import settings from './client/settings'
import communication from './plugins/communication'

export * as Satori from '@satorijs/protocol'
export * from './context'
export * from './utils'
export * from './plugins/router'
export * from './plugins/communication'
export { ScopeStatus } from 'cordis'

export const root = new Context()

root.plugin(communication)
root.plugin(message)
root.plugin(person)
root.plugin(network)
root.plugin(settings)
