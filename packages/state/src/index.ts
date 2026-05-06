import type { Context as CordisContext } from 'cordis'
import type { Mutation } from '@cordisjs/muon'
import { Service } from 'cordis'
import { apply, observe } from '@cordisjs/muon'

export { apply, DeltaState, observe } from '@cordisjs/muon'
export type { Delta, DeltaOp, Mutation, MutationKind, PathSegment } from '@cordisjs/muon'

export interface AdapterEntry {
  enabled: boolean
  config: Record<string, any>
}

export interface PluginEntry {
  enabled: boolean
  source: 'internal' | 'external'
  config: Record<string, any>
}

export interface AppNamespaceState {
  theme: 'light' | 'dark'
  locale: string
  fontSize: 'small' | 'medium' | 'large'
  window: {
    width: number
    height: number
    x: number
    y: number
  }
  sidebar: {
    collapsed: boolean
    width: number
  }
  messageInput: {
    sendKey: 'Enter' | 'Ctrl+Enter' | 'Cmd+Enter'
  }
  network: {
    adapters: Record<string, AdapterEntry>
  }
  plugins: Record<string, PluginEntry>
}

export interface ConversationItem {
  type: 'channel' | 'group' | 'private'
  opened: boolean
  pinned: boolean
  platform: string
  channelId: string
  unreadCount: number
  mute: boolean
}

export interface ConversationNamespaceState {
  currentId: string
  list: ConversationItem[]
  drafts: Record<string, string>
}

export interface AppStateNamespaces {
  app: AppNamespaceState
  conversation: ConversationNamespaceState
  [key: string]: any
}

export const DEFAULT_STATE: AppStateNamespaces = {
  app: {
    theme: 'dark',
    locale: 'zh-CN',
    fontSize: 'medium',
    window: { width: 1076, height: 653, x: 0, y: 0 },
    sidebar: { collapsed: false, width: 280 },
    messageInput: { sendKey: 'Enter' },
    network: { adapters: {} },
    plugins: {},
  },
  conversation: {
    currentId: '',
    list: [],
    drafts: {},
  },
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function pickFields<T extends object>(source: T, fields: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  for (const field of fields) {
    const segments = field.split('.')
    let cursor: any = source
    let valid = true
    for (const seg of segments) {
      if (cursor && typeof cursor === 'object' && seg in cursor) {
        cursor = cursor[seg]
      }
      else {
        valid = false
        break
      }
    }
    if (!valid)
      continue
    let dst = result
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]
      dst[seg] ??= {}
      dst = dst[seg]
    }
    dst[segments[segments.length - 1]] = cursor
  }
  return result
}

export function setByFields<T extends object>(target: T, source: any, fields: string[]): void {
  for (const field of fields) {
    const segments = field.split('.')
    let cur: any = source
    let valid = true
    for (const seg of segments) {
      if (cur && typeof cur === 'object' && seg in cur) {
        cur = cur[seg]
      }
      else {
        valid = false
        break
      }
    }
    if (!valid)
      continue
    let dst: any = target
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]
      if (typeof dst[seg] !== 'object' || dst[seg] === null)
        dst[seg] = {}
      dst = dst[seg]
    }
    dst[segments[segments.length - 1]] = cur
  }
}

declare module 'cordis' {
  interface Context {
    stater: StateService
  }
  interface Events {
    'state/changed': (mutation: Mutation) => void
  }
}

export abstract class StateService extends Service {
  public data: AppStateNamespaces = deepClone(DEFAULT_STATE)

  constructor(ctx: CordisContext) {
    super(ctx, 'stater')
  }

  mutate(fn: (data: AppStateNamespaces) => void): Mutation | null {
    const mutation = observe(this.data, fn)
    if (!mutation)
      return null
    this._onMutate(mutation)
    return mutation
  }

  applyMutation(mutation: Mutation): void {
    apply(this.data, mutation)
    this.ctx.emit('state/changed', mutation)
  }

  snapshot(): AppStateNamespaces {
    return deepClone(this.data)
  }

  protected abstract _onMutate(mutation: Mutation): void
}
