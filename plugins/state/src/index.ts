import type { AppStateNamespaces, Patch } from '@satoriapp/state'
import type { Context } from 'cordis'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import {
  applyPatchToObject,
  deepClone,
  DEFAULT_STATE,
  StateService,
} from '@satoriapp/state'

const FLUSH_DEBOUNCE_MS = 200

interface PersistedState {
  namespaces: AppStateNamespaces
  updatedAt: number
}

export class BackendStateService extends StateService {
  static readonly inject = ['link']

  private readonly storagePath: string
  private flushTimer: NodeJS.Timeout | undefined
  private readonly linkDisposers: Array<() => void> = []

  constructor(ctx: Context) {
    super(ctx)
    let home = process.cwd()
    try {
      const electronApp = (ctx as Context & { app?: { getPath: (name: string) => string } }).app
      if (electronApp && typeof electronApp.getPath === 'function')
        home = electronApp.getPath('home')
    }
    catch {
      /* no Electron app, use cwd */
    }
    this.storagePath = resolve(home, '.satori', 'state.json')
  }

  async start(): Promise<void> {
    await this.load()
    this.registerLinkActions()
  }

  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = undefined
    }
    await this.flush()

    for (const d of this.linkDisposers) d()
    this.linkDisposers.length = 0
  }

  protected _onChange(path: string, value: unknown): void {
    this.ctx.emit('state/changed', path, value)
    this.scheduleFlush()
    this.broadcast([{ p: path, o: 'set', v: value }])
  }

  private registerLinkActions(): void {
    this.linkDisposers.push(
      this.ctx.link.action('state.get', () => this.snapshot()),
    )

    this.linkDisposers.push(
      this.ctx.link.action('state.update', (patches: Patch[]) => {
        if (!Array.isArray(patches))
          return { error: { code: 'EBADREQ', message: 'patches must be an array' } }

        // Apply patches directly to bypass _onChange and avoid re-broadcast loops.
        for (const patch of patches) {
          applyPatchToObject(this._namespaces as Record<string, unknown>, patch)
          this.ctx.emit('state/changed', patch.p, patch.v)
        }

        this.scheduleFlush()
        this.broadcast(patches)

        return { ok: true }
      }),
    )
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.storagePath, 'utf-8')
      if (!raw.trim()) {
        this._namespaces = deepClone(DEFAULT_STATE)
        return
      }
      const payload = JSON.parse(raw) as PersistedState
      this._namespaces = {
        ...deepClone(DEFAULT_STATE),
        ...(payload.namespaces ?? {}),
      }
    }
    catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.ctx.logger('state').warn('failed to load state: %s', err instanceof Error ? err.message : String(err))
      }
      this._namespaces = deepClone(DEFAULT_STATE)
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
    const payload: PersistedState = { namespaces: this._namespaces, updatedAt: Date.now() }
    try {
      await mkdir(dirname(this.storagePath), { recursive: true })
      await writeFile(this.storagePath, JSON.stringify(payload, null, 2), 'utf-8')
    }
    catch (err) {
      this.ctx.logger('state').warn('failed to flush state: %s', err instanceof Error ? err.message : String(err))
    }
  }

  private broadcast(patches: Patch[]): void {
    this.ctx.link.send('state.updated', patches)
  }
}

export { deepClone, DEFAULT_STATE, setByPath } from '@satoriapp/state'
export type { AppStateNamespaces, Patch } from '@satoriapp/state'

export default BackendStateService
