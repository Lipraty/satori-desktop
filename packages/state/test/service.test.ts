import type { Patch } from '../src/index.js'
import { Context } from 'cordis'
import { describe, expect, it, vi } from 'vitest'
import { deepClone, DEFAULT_STATE, StateService } from '../src/index.js'

// ─── Concrete test subclass ───────────────────────────────────────────────────

class TestStateService extends StateService {
  readonly changes: Array<{ path: string, value: unknown }> = []

  protected _onChange(path: string, value: unknown): void {
    this.changes.push({ path, value })
  }
}

function makeService() {
  const ctx = new Context()
  const svc = new TestStateService(ctx)
  return { ctx, svc }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('stateService — ctx.state registration', () => {
  it('registers as ctx.state', () => {
    const { ctx, svc } = makeService()
    expect((ctx as any).state).toBe(svc)
  })

  it('starts with default state', () => {
    const { svc } = makeService()
    expect(svc.snapshot()).toEqual(deepClone(DEFAULT_STATE))
  })
})

describe('stateService — app namespace proxy', () => {
  it('set primitive: triggers _onChange with full path', () => {
    const { svc } = makeService()
    svc.app.theme = 'light'
    expect(svc.changes).toContainEqual({ path: 'app.theme', value: 'light' })
  })

  it('set mutates raw internal state', () => {
    const { svc } = makeService()
    svc.app.theme = 'light'
    expect(svc.snapshot().app.theme).toBe('light')
  })

  it('get returns current value', () => {
    const { svc } = makeService()
    svc.app.theme = 'light'
    expect(svc.app.theme).toBe('light')
  })

  it('nested set: triggers _onChange with full dotted path', () => {
    const { svc } = makeService()
    svc.app.window.width = 1920
    expect(svc.changes).toContainEqual({ path: 'app.window.width', value: 1920 })
  })

  it('nested set mutates raw internal state', () => {
    const { svc } = makeService()
    svc.app.sidebar.collapsed = true
    expect(svc.snapshot().app.sidebar.collapsed).toBe(true)
  })
})

describe('stateService — conversation namespace proxy', () => {
  it('set currentId triggers _onChange', () => {
    const { svc } = makeService()
    svc.conversation.currentId = 'ch-1'
    expect(svc.changes).toContainEqual({ path: 'conversation.currentId', value: 'ch-1' })
  })

  it('list.push triggers _onChange with full array', () => {
    const { svc } = makeService()
    const item = {
      type: 'channel' as const,
      opened: true,
      pinned: false,
      platform: 'qq',
      channelId: 'ch-1',
      unreadCount: 0,
      mute: false,
    }
    svc.conversation.list.push(item)
    const change = svc.changes.find(c => c.path === 'conversation.list')
    expect(change).toBeDefined()
    expect(change!.value).toEqual([item])
  })
})

describe('stateService — ns() dynamic namespace', () => {
  it('creates an empty namespace on first access', () => {
    const { svc } = makeService()
    const ns = svc.ns<{ count: number }>('plugin:emoji')
    ns.count = 5
    expect(svc.changes).toContainEqual({ path: 'plugin:emoji.count', value: 5 })
  })

  it('dynamic namespace is reflected in snapshot', () => {
    const { svc } = makeService()
    svc.ns<{ x: number }>('custom').x = 42
    expect((svc.snapshot() as any).custom.x).toBe(42)
  })
})

describe('stateService — snapshot()', () => {
  it('returns a deep clone (not the raw reference)', () => {
    const { svc } = makeService()
    const snap = svc.snapshot()
    snap.app.theme = 'light'
    // Original is unchanged
    expect(svc.app.theme).toBe('dark')
  })

  it('reflects all applied changes', () => {
    const { svc } = makeService()
    svc.app.locale = 'en-US'
    svc.conversation.currentId = 'abc'
    const snap = svc.snapshot()
    expect(snap.app.locale).toBe('en-US')
    expect(snap.conversation.currentId).toBe('abc')
  })
})

describe('stateService — applyPatch()', () => {
  it('applies a set patch without calling _onChange', () => {
    const { svc } = makeService()
    const patch: Patch = { p: 'app.theme', o: 'set', v: 'light' }
    svc.applyPatch(patch)

    // Raw state is updated
    expect(svc.snapshot().app.theme).toBe('light')
    // _onChange was NOT called
    expect(svc.changes).toHaveLength(0)
  })

  it('applies a delete patch', () => {
    const { svc } = makeService()
    // First set a value to delete
    svc.applyPatch({ p: 'app.locale', o: 'set', v: 'en-US' })
    svc.applyPatch({ p: 'app.locale', o: 'delete' })
    expect(svc.snapshot().app.locale).toBeUndefined()
  })

  it('emits state/changed event', () => {
    const { ctx, svc } = makeService()
    const listener = vi.fn()
    ctx.on('state/changed', listener)

    svc.applyPatch({ p: 'app.theme', o: 'set', v: 'light' })

    expect(listener).toHaveBeenCalledWith('app.theme', 'light')
  })
})

describe('stateService — applyPatches()', () => {
  it('applies multiple patches in order', () => {
    const { svc } = makeService()
    svc.applyPatches([
      { p: 'app.theme', o: 'set', v: 'light' },
      { p: 'app.locale', o: 'set', v: 'en-US' },
      { p: 'conversation.currentId', o: 'set', v: 'ch-1' },
    ])
    const snap = svc.snapshot()
    expect(snap.app.theme).toBe('light')
    expect(snap.app.locale).toBe('en-US')
    expect(snap.conversation.currentId).toBe('ch-1')
  })
})

describe('stateService — _onChange is NOT called by applyPatch', () => {
  it('proxy writes call _onChange, applyPatch does not', () => {
    const { svc } = makeService()

    svc.app.theme = 'light' // via proxy → _onChange called
    expect(svc.changes).toHaveLength(1)

    svc.applyPatch({ p: 'app.theme', o: 'set', v: 'dark' }) // silent apply
    expect(svc.changes).toHaveLength(1) // still 1, not called again
  })
})
