import type { Context as CordisContext } from 'cordis'
import { Service } from 'cordis'
import { makeDeepProxy } from './proxy.js'

export { makeDeepProxy } from './proxy.js'

export interface Patch {
  p: string
  o: 'set' | 'delete'
  v?: unknown
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

export function setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segs = path.split('.').filter(Boolean)
  if (!segs.length)
    return
  let cur: Record<string, unknown> = target
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i]
    if (!cur[k] || typeof cur[k] !== 'object')
      cur[k] = {}
    cur = cur[k] as Record<string, unknown>
  }
  cur[segs[segs.length - 1]] = value
}

export function deleteByPath(target: Record<string, unknown>, path: string): void {
  const segs = path.split('.').filter(Boolean)
  if (!segs.length)
    return
  let cur: Record<string, unknown> = target
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i]
    if (!cur[k] || typeof cur[k] !== 'object')
      return
    cur = cur[k] as Record<string, unknown>
  }
  delete cur[segs[segs.length - 1]]
}

export function getByPath(target: Record<string, unknown>, path: string): unknown {
  const segs = path.split('.').filter(Boolean)
  let cur: unknown = target
  for (const seg of segs) {
    if (cur == null || typeof cur !== 'object')
      return undefined
    cur = (cur as Record<string, unknown>)[seg]
  }
  return cur
}

export function applyPatchToObject(target: Record<string, unknown>, patch: Patch): void {
  if (patch.o === 'set')
    setByPath(target, patch.p, patch.v)
  else
    deleteByPath(target, patch.p)
}

declare module 'cordis' {
  interface Context {
    stater: StateService
  }
  interface Events {
    'state/changed': (path: string, value: unknown) => void
  }
}

// applyPatch/applyPatches bypass _onChange to avoid re-broadcast loops; they emit state/changed directly.
export abstract class StateService extends Service {
  protected _namespaces: AppStateNamespaces = deepClone(DEFAULT_STATE)

  constructor(ctx: CordisContext) {
    super(ctx, 'stater', true)
  }

  get app(): AppNamespaceState {
    return makeDeepProxy(
      this._namespaces.app,
      (p, v) => this._onChange(`app.${p}`, v),
    )
  }

  get conversation(): ConversationNamespaceState {
    return makeDeepProxy(
      this._namespaces.conversation,
      (p, v) => this._onChange(`conversation.${p}`, v),
    )
  }

  ns<T extends Record<string, unknown> = Record<string, unknown>>(namespace: string): T {
    if (!(namespace in this._namespaces))
      (this._namespaces as Record<string, unknown>)[namespace] = {}
    return makeDeepProxy(
      (this._namespaces as Record<string, unknown>)[namespace] as T,
      (p, v) => this._onChange(`${namespace}.${p}`, v),
    )
  }

  snapshot(): AppStateNamespaces {
    return deepClone(this._namespaces)
  }

  applyPatch(patch: Patch): void {
    applyPatchToObject(this._namespaces as Record<string, unknown>, patch)
    this.ctx.emit('state/changed', patch.p, patch.v)
  }

  applyPatches(patches: Patch[]): void {
    for (const p of patches) this.applyPatch(p)
  }

  protected abstract _onChange(path: string, value: unknown): void
}
