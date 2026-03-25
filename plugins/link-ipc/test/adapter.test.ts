import { Link } from '@satoriapp/link'
import { Context } from 'cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcClientAdapter } from '../src/index.js'

// ─── Mock ipcRenderer ─────────────────────────────────────────────────────────

type IpcListener = (...args: unknown[]) => void

const mockIpc = {
  invoke: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  on: vi.fn<(ch: string, fn: IpcListener) => void>(),
  removeListener: vi.fn<(ch: string, fn: IpcListener) => void>(),
}

function makeAdapter() {
  const ctx = new Context()
  return { ctx, adapter: new IpcClientAdapter(ctx) }
}

beforeEach(() => {
  ;(globalThis as Record<string, unknown>).electron = { ipcRenderer: mockIpc }
  vi.clearAllMocks()
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).electron
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ipcClientAdapter — invoke()', () => {
  it('calls ipcRenderer.invoke with the correct channel and payload', async () => {
    const { adapter } = makeAdapter()
    mockIpc.invoke.mockResolvedValueOnce({ pong: true })

    const res = await adapter.invoke('ping', { ts: 1 })

    expect(mockIpc.invoke).toHaveBeenCalledWith('satori:ping', { ts: 1 })
    expect(res.data).toEqual({ pong: true })
    expect(res.error).toBeUndefined()
  })

  it('normalises path with satori: prefix', async () => {
    const { adapter } = makeAdapter()
    mockIpc.invoke.mockResolvedValueOnce({})

    await adapter.invoke('message.list', {})
    expect(mockIpc.invoke).toHaveBeenCalledWith('satori:message.list', {})
  })

  it('strips leading slash from path', async () => {
    const { adapter } = makeAdapter()
    mockIpc.invoke.mockResolvedValueOnce({})

    await adapter.invoke('/ping', {})
    expect(mockIpc.invoke).toHaveBeenCalledWith('satori:ping', {})
  })

  it('returns ENOSYS when ipcRenderer is unavailable', async () => {
    delete (globalThis as Record<string, unknown>).electron
    const { adapter } = makeAdapter()

    const res = await adapter.invoke('ping')
    expect(res.error?.code).toBe(Link.ErrorCode.ENOSYS)
  })

  it('returns EIPC on ipcRenderer.invoke rejection', async () => {
    const { adapter } = makeAdapter()
    mockIpc.invoke.mockRejectedValueOnce(new Error('IPC error'))

    const res = await adapter.invoke('ping')
    expect(res.error?.code).toBe(Link.ErrorCode.EIPC)
    expect(res.error?.message).toBe('IPC error')
  })

  it('returns ETIMEOUT when invoke hangs past ACTION_TIMEOUT_MS', async () => {
    vi.useFakeTimers()
    const { adapter } = makeAdapter()
    mockIpc.invoke.mockImplementationOnce(() => new Promise(() => {})) // never resolves

    const invokePromise = adapter.invoke('slow')
    vi.advanceTimersByTime(16_000)
    const res = await invokePromise

    expect(res.error?.code).toBe(Link.ErrorCode.ETIMEOUT)
    vi.useRealTimers()
  })
})

describe('ipcClientAdapter — subscribe()', () => {
  it('registers a single ipcRenderer.on per event channel', () => {
    const { adapter } = makeAdapter()
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    adapter.subscribe('message.created', listenerA)
    adapter.subscribe('message.created', listenerB)

    expect(mockIpc.on).toHaveBeenCalledTimes(1)
    expect(mockIpc.on).toHaveBeenCalledWith('satori:message.created', expect.any(Function))
  })

  it('delivers pushed event to all subscribers', () => {
    const { adapter } = makeAdapter()
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    adapter.subscribe('message.created', listenerA)
    adapter.subscribe('message.created', listenerB)

    const [, wrappedListener] = mockIpc.on.mock.calls[0]
    wrappedListener(undefined /* event */, { id: '1' })

    expect(listenerA).toHaveBeenCalledWith({ id: '1' })
    expect(listenerB).toHaveBeenCalledWith({ id: '1' })
  })

  it('disposer removes listener; last listener also removes ipcRenderer.on', () => {
    const { adapter } = makeAdapter()
    const listener = vi.fn()
    const dispose = adapter.subscribe('tick', listener)

    const [, wrapped] = mockIpc.on.mock.calls[0]
    wrapped(undefined, 42)
    expect(listener).toHaveBeenCalledWith(42)

    dispose()
    expect(mockIpc.removeListener).toHaveBeenCalledWith('satori:tick', wrapped)

    wrapped(undefined, 99)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('partial dispose keeps channel alive', () => {
    const { adapter } = makeAdapter()
    const a = vi.fn()
    const b = vi.fn()
    const disposeA = adapter.subscribe('msg', a)
    adapter.subscribe('msg', b)

    disposeA()
    expect(mockIpc.removeListener).not.toHaveBeenCalled()

    const [, wrapped] = mockIpc.on.mock.calls[0]
    wrapped(undefined, 'data')
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledWith('data')
  })
})

describe('ipcClientAdapter — server-side stubs', () => {
  it('handle() is a no-op and returns an empty disposer', () => {
    const { adapter } = makeAdapter()
    const dispose = adapter.handle('path', vi.fn())
    expect(typeof dispose).toBe('function')
    expect(() => dispose()).not.toThrow()
  })

  it('broadcast() is a no-op', () => {
    const { adapter } = makeAdapter()
    expect(() => adapter.broadcast('event', {})).not.toThrow()
  })
})

describe('ipcClientAdapter — dispose()', () => {
  it('removes all ipcRenderer.on listeners', () => {
    const { adapter } = makeAdapter()
    adapter.subscribe('a', vi.fn())
    adapter.subscribe('b', vi.fn())

    adapter.dispose()

    expect(mockIpc.removeListener).toHaveBeenCalledTimes(2)
  })

  it('clears all internal state', () => {
    const { adapter } = makeAdapter()
    adapter.subscribe('a', vi.fn())
    adapter.dispose()

    expect(mockIpc.removeListener).toHaveBeenCalledTimes(1)
  })
})
