import type { Patch } from '../src/index.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from 'cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackendStateService } from '../src/index.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let tmpDir: string

async function makeService(storagePath?: string) {
  const ctx = new Context()
  // Patch storage path via the constructor's resolution logic (easier: inject
  // via the Electron app getter mock)
  const svc = new BackendStateService(ctx)
  // Override storage path via reflection (private field access for tests)
  ;(svc as any).storagePath = storagePath ?? join(tmpDir, 'state.json')
  return { ctx, svc }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'satori-state-test-'))
  vi.useFakeTimers()
})

afterEach(async () => {
  vi.useRealTimers()
  await rm(tmpDir, { recursive: true, force: true })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('backendStateService — start() / load()', () => {
  it('loads default state when file does not exist', async () => {
    const { svc } = await makeService(join(tmpDir, 'nonexistent', 'state.json'))
    await svc.start()
    expect(svc.snapshot().app.theme).toBe('dark')
  })

  it('loads persisted state from disk', async () => {
    const path = join(tmpDir, 'state.json')
    const { writeFile, mkdir } = await import('node:fs/promises')
    const { dirname } = await import('node:path')
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify({
      namespaces: { app: { theme: 'light', locale: 'en-US' }, conversation: { currentId: '', list: [], drafts: {} } },
      updatedAt: Date.now(),
    }), 'utf-8')

    const { svc } = await makeService(path)
    await svc.start()
    expect(svc.snapshot().app.theme).toBe('light')
    expect(svc.snapshot().app.locale).toBe('en-US')
  })

  it('handles empty file gracefully', async () => {
    const path = join(tmpDir, 'state.json')
    const { writeFile } = await import('node:fs/promises')
    await writeFile(path, '   ', 'utf-8')

    const { svc } = await makeService(path)
    await svc.start()
    expect(svc.snapshot().app.theme).toBe('dark') // falls back to default
  })
})

describe('backendStateService — proxy writes', () => {
  it('writing via proxy updates internal state', async () => {
    const { svc } = await makeService()
    await svc.start()

    svc.app.theme = 'light'
    expect(svc.snapshot().app.theme).toBe('light')
  })

  it('writing via proxy emits state/changed event', async () => {
    const { ctx, svc } = await makeService()
    await svc.start()

    const listener = vi.fn()
    ctx.on('state/changed', listener)

    svc.app.locale = 'en-US'
    expect(listener).toHaveBeenCalledWith('app.locale', 'en-US')
  })

  it('writing via proxy schedules a flush', async () => {
    const { svc } = await makeService()
    await svc.start()

    svc.app.theme = 'light'
    expect((svc as any).flushTimer).toBeDefined()
  })

  it('flush writes state to disk after debounce', async () => {
    const path = join(tmpDir, 'state.json')
    const { svc } = await makeService(path)
    await svc.start()

    svc.app.theme = 'light'
    vi.advanceTimersByTime(300)
    await vi.runAllTimersAsync()

    const { readFile } = await import('node:fs/promises')
    const raw = await readFile(path, 'utf-8')
    const payload = JSON.parse(raw)
    expect(payload.namespaces.app.theme).toBe('light')
  })
})

describe('backendStateService — state.get / state.update link actions', () => {
  it('state.get returns the current snapshot', async () => {
    const { ctx, svc } = await makeService()
    await svc.start()
    svc.app.theme = 'light'

    // Simulate ctx.link being available
    const handlers = new Map<string, (payload: unknown) => unknown>()
    ;(ctx as any).link = {
      action: (path: string, handler: (payload: unknown) => unknown) => {
        handlers.set(path, handler)
        return () => handlers.delete(path)
      },
      send: vi.fn(),
    }

    // Re-register link actions
    ;(svc as any).linkDisposers.length = 0
    ;(svc as any).registerLinkActions()

    const result = handlers.get('state.get')!({})
    expect((result as any).app.theme).toBe('light')
  })

  it('state.update applies patches and broadcasts', async () => {
    const { ctx, svc } = await makeService()
    await svc.start()

    const mockSend = vi.fn()
    const handlers = new Map<string, (payload: unknown) => unknown>()
    ;(ctx as any).link = {
      action: (path: string, handler: (payload: unknown) => unknown) => {
        handlers.set(path, handler)
        return () => handlers.delete(path)
      },
      send: mockSend,
    }

    ;(svc as any).linkDisposers.length = 0
    ;(svc as any).registerLinkActions()

    const patches: Patch[] = [{ p: 'app.theme', o: 'set', v: 'light' }]
    handlers.get('state.update')!(patches)

    expect(svc.snapshot().app.theme).toBe('light')
    expect(mockSend).toHaveBeenCalledWith('state.updated', patches)
  })

  it('state.update with invalid payload returns EBADREQ error', async () => {
    const { ctx, svc } = await makeService()
    await svc.start()

    const handlers = new Map<string, (payload: unknown) => unknown>()
    ;(ctx as any).link = {
      action: (path: string, handler: (payload: unknown) => unknown) => {
        handlers.set(path, handler)
        return () => handlers.delete(path)
      },
      send: vi.fn(),
    }

    ;(svc as any).linkDisposers.length = 0
    ;(svc as any).registerLinkActions()

    const result = handlers.get('state.update')!('not-an-array')
    expect((result as any).error?.code).toBe('EBADREQ')
  })
})

describe('backendStateService — stop()', () => {
  it('flushes on stop', async () => {
    const path = join(tmpDir, 'state.json')
    const { svc } = await makeService(path)
    await svc.start()

    svc.app.theme = 'light'

    // stop() should flush without waiting for debounce
    vi.useRealTimers()
    await svc.stop()

    const { readFile } = await import('node:fs/promises')
    const payload = JSON.parse(await readFile(path, 'utf-8'))
    expect(payload.namespaces.app.theme).toBe('light')
  })
})
