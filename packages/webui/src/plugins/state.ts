import type { AppStateNamespaces } from '@satoriapp/state'
import type { Context } from 'cordis'
import type { Delta, Mutation } from '@cordisjs/muon'
import { Service } from 'cordis'
import { apply, DeltaState, observe } from '@cordisjs/muon'
import { reactive } from 'vue'
import { deepClone, StateService } from '@satoriapp/state'

export { StateService }
export type { AppStateNamespaces }

interface AppStateGetReply {
  ownerId: string
  state: AppStateNamespaces
  cursor: any
  updatedAt: number
}

interface AppStateUpdatedEvent {
  ownerId: string
  delta?: Delta
  state?: AppStateNamespaces
  timestamp: number
}

export class FrontendStateService extends StateService {
  static inject = ['link']

  private readonly deltaState = new DeltaState()
  private ownerId?: string

  constructor(ctx: Context) {
    super(ctx)
    this.data = reactive(this.data) as AppStateNamespaces
  }

  private get link() {
    return this.ctx.link
  }

  override mutate(fn: (data: AppStateNamespaces) => void): Mutation | null {
    const clone = deepClone(this.data)
    const mutation = observe(clone, fn)
    if (!mutation)
      return null
    this._onMutate(mutation)
    return mutation
  }

  async* [Service.init]() {
    try {
      const remote = await this.link.action<{}, AppStateGetReply>('app.state.get', {})
      if (remote?.ownerId)
        this.ownerId = remote.ownerId
      if (remote?.state)
        Object.assign(this.data, remote.state)
      if (remote?.cursor)
        this.deltaState.restore(remote.cursor)
    }
    catch (err) {
      console.warn('[state] app.state.get failed:', err instanceof Error ? err.message : String(err))
    }

    const disposeListener = this.link.on('app-state-updated', (event: AppStateUpdatedEvent) => {
      if (event.delta) {
        const mutation = this.deltaState.load(event.delta)
        apply(this.data, mutation)
        this.ctx.emit('state/changed', mutation)
        return
      }
      if (event.state) {
        Object.assign(this.data, event.state)
      }
    })

    yield () => disposeListener()
  }

  protected _onMutate(mutation: Mutation): void {
    const delta = this.deltaState.dump(mutation)
    void this.link
      .action('app.state.update', {
        ownerId: this.ownerId,
        delta,
      })
      .catch((err: unknown) => {
        console.warn('[state] app.state.update failed:', err instanceof Error ? err.message : String(err))
      })
  }
}

export default FrontendStateService
