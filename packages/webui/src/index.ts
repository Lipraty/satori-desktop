import { Context } from './context'
import person from './client/person'
import message from './client/messages'
import network from './client/network'
import settings from './client/settings'

import CommunicationService from './plugins/communication'
import { WebAdapter } from '@satoriapp/plugin-communication-web'

export * as Satori from '@satorijs/protocol'
export * from './context'
export * from './utils'
export * from './plugins/router'
export { ScopeStatus } from 'cordis'
export {
  CommunicationAdapter,
  CommunicationEvent,
  CommunicationRequest,
  CommunicationResponse
} from './plugins/communication'

export const root = new Context()

root.plugin(CommunicationService)
root.plugin(message)
root.plugin(person)
root.plugin(network)
root.plugin(settings)

const baseUrl = root.versions.Runtime === 'web' ? window.location.origin : new URLSearchParams(window.location.search).get('serveru')
root.communication.setAdapter(new WebAdapter(root, baseUrl))
