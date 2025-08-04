import message from './client/messages'

import network from './client/network'
import person from './client/person'
import settings from './client/settings'
import { Context } from './context'
import communication from './plugins/communication'

export * from './context'
export * from './plugins/communication'
export * from './plugins/router'
export * from './utils'
export * as Satori from '@satorijs/protocol'
export { ScopeStatus } from 'cordis'

export const root = new Context()

root.plugin(communication)

// pages
root.plugin(message)
root.plugin(person)
root.plugin(network)
root.plugin(settings)
