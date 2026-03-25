import { Context } from './context'

export * from './context'
export * from './data'
export * from './plugins/router'
export * from './plugins/setting'
export * from './plugins/slot'
export * from './utils'
export * as Satori from '@satorijs/protocol'
export { ScopeStatus } from 'cordis'

export const root = new Context()
