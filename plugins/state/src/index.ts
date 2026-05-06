import type { AppStateNamespaces } from '@satoriapp/state'
import type { Context } from 'cordis'
import type { Delta, Mutation } from '@cordisjs/muon'
import { Service } from 'cordis'
import { randomUUID } from 'node:crypto'
import { apply, DeltaState } from '@cordisjs/muon'
import {
  deepClone,
  DEFAULT_STATE,
  pickFields,
  setByFields,
  StateService,
} from '@satoriapp/state'

declare module '@cordisjs/plugin-database' {
  interface Tables {
    app_state: AppStateRow
  }
}

export interface AppStateRow {
  uid: string
  ownerId: string
  state: AppStateNamespaces
  updatedAt: number
}

export interface AppStateGetPayload {
  ownerId?: string
  fields?: string[]
}

export interface AppStateUpdatePayload {
  ownerId?: string
  state?: Partial<AppStateNamespaces>
  delta?: Delta
  fields?: string[]
}

const FLUSH_DEBOUNCE_MS = 200

export class BackendStateService extends StateService {
  static readonly inject = ['link', 'logger', 'database', 'model', 'loader']

  private readonly deltaState = new DeltaState()
  private flushTimer: NodeJS.Timeout | undefined
  private ownerId!: string
  private syncingFromLoader = false
  private syncingToLoader = false

  constructor(ctx: Context) {
    super(ctx)
  }

  async* [Service.init]() {
    this.ctx.model.extend('app_state', {
      uid: 'string',
      ownerId: 'string',
      state: 'json',
      updatedAt: 'unsigned(8)',
    }, { primary: 'uid' })

    this.ownerId = await this.resolveOwnerId()
    await this.load()

    this.projectFromLoader()

    yield this.ctx.link.action('app.state.get', (payload: AppStateGetPayload = {}) => {
      const ownerId = payload.ownerId ?? this.ownerId
      if (ownerId !== this.ownerId)
        return { state: {}, cursor: this.deltaState.snapshot() }
      const fields = payload.fields
      const state = (!fields || !fields.length) ? deepClone(this.data) : pickFields(this.data, fields)
      return { ownerId, state, cursor: this.deltaState.snapshot(), updatedAt: Date.now() }
    })

    yield this.ctx.link.action('app.state.update', (payload: AppStateUpdatePayload = {}) => {
      const ownerId = payload.ownerId ?? this.ownerId
      if (ownerId !== this.ownerId) {
        return { error: { code: 'EBADREQ', message: `unknown owner_id: ${ownerId}` } }
      }
      if (payload.delta) {
        const mutation = this.deltaState.load(payload.delta)
        apply(this.data, mutation)
        this.commit(mutation)
        this.applyLoaderProjection(mutation)
        return { ok: true, cursor: this.deltaState.snapshot() }
      }
      if (payload.state) {
        const fields = payload.fields
        if (!fields || !fields.length) {
          this.data = { ...deepClone(DEFAULT_STATE), ...payload.state } as AppStateNamespaces
        }
        else {
          setByFields(this.data, payload.state, fields)
        }
        this.scheduleFlush()
        this.broadcastSnapshot()
        this.syncToLoader()
        return { ok: true, cursor: this.deltaState.snapshot() }
      }
      return { error: { code: 'EBADREQ', message: 'state or delta required' } }
    })

    yield () => {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer)
        this.flushTimer = undefined
      }
      void this.flush()
    }
  }

  protected _onMutate(mutation: Mutation): void {
    this.commit(mutation)
  }

  private commit(mutation: Mutation): void {
    this.ctx.emit('state/changed', mutation)
    this.scheduleFlush()
    this.broadcastDelta(mutation)
  }

  private broadcastDelta(mutation: Mutation): void {
    const delta = this.deltaState.dump(mutation)
    this.ctx.emit('link/send', 'app-state-updated', {
      ownerId: this.ownerId,
      delta,
      timestamp: Date.now(),
    })
  }

  private broadcastSnapshot(): void {
    this.ctx.emit('link/send', 'app-state-updated', {
      ownerId: this.ownerId,
      state: deepClone(this.data),
      timestamp: Date.now(),
    })
  }

  private async resolveOwnerId(): Promise<string> {
    const rows = await this.ctx.database.get('app_state', {})
    if (rows.length)
      return rows[0].ownerId || rows[0].uid
    const id = randomUUID()
    await this.ctx.database.upsert('app_state', [{
      uid: id,
      ownerId: id,
      state: deepClone(DEFAULT_STATE),
      updatedAt: Date.now(),
    }])
    return id
  }

  private async load(): Promise<void> {
    const rows = await this.ctx.database.get('app_state', { ownerId: this.ownerId })
    if (rows.length && rows[0].state) {
      this.data = { ...deepClone(DEFAULT_STATE), ...rows[0].state }
    }
    else {
      this.data = deepClone(DEFAULT_STATE)
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer)
      return
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined
      void this.flush()
    }, FLUSH_DEBOUNCE_MS)
  }

  private async flush(): Promise<void> {
    try {
      await this.ctx.database.upsert('app_state', [{
        uid: this.ownerId,
        ownerId: this.ownerId,
        state: this.data,
        updatedAt: Date.now(),
      }])
    }
    catch (err) {
      this.ctx.logger('state').warn('failed to flush state: %s', err instanceof Error ? err.message : String(err))
    }
  }

  private projectFromLoader(): void {
    if (this.syncingToLoader)
      return
    this.syncingFromLoader = true
    try {
      const adapters: Record<string, { enabled: boolean, config: Record<string, any> }> = {}
      const plugins: Record<string, { enabled: boolean, source: 'internal' | 'external', config: Record<string, any> }> = {}
      for (const entry of this.ctx.loader.entries()) {
        const name = entry.options.name || ''
        const isInternal = name.startsWith('cordis:')
        const pluginName = isInternal ? name.slice(7) : name
        const enabled = !!entry.fiber?.uid && !entry.options.disabled
        const config = (entry.options.config ?? {}) as Record<string, any>
        if (isAdapter(name)) {
          adapters[pluginName] = { enabled, config }
        }
        else if (!isInternal) {
          plugins[pluginName] = { enabled, source: 'external', config }
        }
      }
      this.data.app.network = { adapters }
      this.data.app.plugins = plugins
    }
    finally {
      this.syncingFromLoader = false
    }
  }

  private syncToLoader(): void {
    if (this.syncingFromLoader)
      return
    this.syncingToLoader = true
    try {
      const adapters = this.data.app.network?.adapters ?? {}
      const plugins = this.data.app.plugins ?? {}
      for (const entry of this.ctx.loader.entries()) {
        const name = entry.options.name || ''
        const isInternal = name.startsWith('cordis:')
        const pluginName = isInternal ? name.slice(7) : name
        const target = isAdapter(name) ? adapters[pluginName] : (!isInternal ? plugins[pluginName] : undefined)
        if (!target)
          continue
        const next: any = {}
        if (target.config !== undefined)
          next.config = target.config
        next.disabled = target.enabled ? undefined : true
        void entry.update(next)
      }
    }
    finally {
      this.syncingToLoader = false
    }
  }

  private applyLoaderProjection(mutation: Mutation): void {
    const path = mutation.path.map(s => String(s))
    if (path[0] !== 'app')
      return
    if (path[1] !== 'network' && path[1] !== 'plugins')
      return
    this.syncToLoader()
  }
}

function isAdapter(name: string | undefined): boolean {
  if (!name)
    return false
  return name.includes('adapter-')
}

export type { Delta, Mutation } from '@cordisjs/muon'
export { deepClone, DEFAULT_STATE } from '@satoriapp/state'
export type { AppStateNamespaces } from '@satoriapp/state'

export default BackendStateService
