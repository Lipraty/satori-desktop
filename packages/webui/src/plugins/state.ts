import type { AppStateNamespaces, Patch } from '@satoriapp/state'
import type { Context } from '@satoriapp/webui'
import { deepClone, DEFAULT_STATE, StateService } from '@satoriapp/state'

export { StateService }
export type { AppStateNamespaces, Patch }

export class FrontendStateService extends StateService {
  static inject = ['link']

  private readonly eventDisposers: Array<() => void> = []

  constructor(ctx: Context) {
    super(ctx)
  }

  private get link() {
    return this.ctx.link
  }

  async start(): Promise<void> {
    try {
      const remote = await this.link.action<AppStateNamespaces>('state.get')
      if (remote) {
        this._namespaces = { ...deepClone(DEFAULT_STATE), ...remote }
      }
    }
    catch {
      this.ctx.logger('state').warn('state.get failed — using default state')
    }

    this.eventDisposers.push(
      this.link.on('state.updated', (patches: Patch[]) => {
        this.applyPatches(patches)
      }),
    )
  }

  async stop(): Promise<void> {
    for (const d of this.eventDisposers) d()
    this.eventDisposers.length = 0
  }

  protected _onChange(path: string, value: unknown): void {
    // Proxy write is already applied locally; forward to backend as authoritative source.
    void this.link
      .action('state.update', [{ p: path, o: 'set', v: value }])
      .catch((err: unknown) => {
        this.ctx.logger('state').warn('state.update failed: %s', err instanceof Error ? err.message : String(err))
      })
  }
}

export default FrontendStateService
