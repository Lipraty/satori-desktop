import { Link } from '@satoriapp/link'
import { Context } from 'cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkIpcClient } from '../src/index.js'

type IpcListener = (...args: unknown[]) => void

const mockIpc = {
  invoke: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  on: vi.fn<(ch: string, fn: IpcListener) => void>(),
  removeListener: vi.fn<(ch: string, fn: IpcListener) => void>(),
}

function makeLink() {
  const ctx = new Context()
  const link = new LinkIpcClient(ctx)
  return { ctx, link }
}

beforeEach(() => {
  ;(globalThis as Record<string, unknown>).electron = { ipcRenderer: mockIpc }
  vi.clearAllMocks()
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).electron
})

describe('linkIpcClient — action() invoke', () => {
  it('calls ipcRenderer.invoke with the correct channel and payload', async () => {
    const { link } = makeLink()
    mockIpc.invoke.mockResolvedValueOnce({ data: { pong: true } })

    const result = await link.action('ping', { ts: 1 })

    expect(mockIpc.invoke).toHaveBeenCalledWith('sapp:ping', { ts: 1 })
    expect(result).toEqual({ pong: true })
  })

  it('normalises path with satori: prefix', async () => {
    const { link } = makeLink()
    mockIpc.invoke.mockResolvedValueOnce({ data: {} })

    await link.action('message.list', {})
    expect(mockIpc.invoke).toHaveBeenCalledWith('sapp:message.list', {})
  })

  it('strips leading slash from path', async () => {
    const { link } = makeLink()
    mockIpc.invoke.mockResolvedValueOnce({ data: {} })

    await link.action('/ping', {})
    expect(mockIpc.invoke).toHaveBeenCalledWith('sapp:ping', {})
  })

  it('throws ENOSYS when ipcRenderer is unavailable', async () => {
    delete (globalThis as Record<string, unknown>).electron
    const { link } = makeLink()

    await expect(link.action('ping')).rejects.toMatchObject({ code: Link.ErrorCode.ENOSYS })
  })

  it('throws EIPC on ipcRenderer.invoke rejection', async () => {
    const { link } = makeLink()
    mockIpc.invoke.mockRejectedValueOnce(new Error('IPC error'))

    await expect(link.action('ping')).rejects.toMatchObject({
      code: Link.ErrorCode.EIPC,
      message: 'IPC error',
    })
  })

  it('throws ETIMEOUT when invoke hangs past ACTION_TIMEOUT_MS', async () => {
    vi.useFakeTimers()
    const { link } = makeLink()
    mockIpc.invoke.mockImplementationOnce(() => new Promise(() => {}))

    const invokePromise = link.action('slow')
    vi.advanceTimersByTime(16_000)
    await expect(invokePromise).rejects.toMatchObject({ code: Link.ErrorCode.ETIMEOUT })
    vi.useRealTimers()
  })
})

describe('linkIpcClient — on() subscribe', () => {
  it('registers a single ipcRenderer.on per event channel', () => {
    const { link } = makeLink()

    link.on('message.created', vi.fn())
    link.on('message.created', vi.fn())

    expect(mockIpc.on).toHaveBeenCalledTimes(1)
    expect(mockIpc.on).toHaveBeenCalledWith('sapp:message.created', expect.any(Function))
  })

  it('delivers pushed event to all subscribers', () => {
    const { link } = makeLink()
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    link.on('message.created', listenerA)
    link.on('message.created', listenerB)

    const [, wrappedListener] = mockIpc.on.mock.calls[0]
    wrappedListener(undefined, { id: '1' })

    expect(listenerA).toHaveBeenCalledWith({ id: '1' })
    expect(listenerB).toHaveBeenCalledWith({ id: '1' })
  })

  it('disposer removes listener; last listener also removes ipcRenderer.on', () => {
    const { link } = makeLink()
    const listener = vi.fn()
    const dispose = link.on('tick', listener)

    const [, wrapped] = mockIpc.on.mock.calls[0]
    wrapped(undefined, 42)
    expect(listener).toHaveBeenCalledWith(42)

    dispose()
    expect(mockIpc.removeListener).toHaveBeenCalledWith('sapp:tick', wrapped)

    wrapped(undefined, 99)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('partial dispose keeps channel alive', () => {
    const { link } = makeLink()
    const a = vi.fn()
    const b = vi.fn()
    const disposeA = link.on('msg', a)
    link.on('msg', b)

    disposeA()
    expect(mockIpc.removeListener).not.toHaveBeenCalled()

    const [, wrapped] = mockIpc.on.mock.calls[0]
    wrapped(undefined, 'data')
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledWith('data')
  })
})

describe('linkIpcClient — server-side stubs', () => {
  it('action(path, handler) is a no-op and returns an empty disposer', () => {
    const { link } = makeLink()
    const dispose = link.action('path', vi.fn())
    expect(typeof dispose).toBe('function')
    expect(() => dispose()).not.toThrow()
  })
})

describe('linkIpcClient — stop()', () => {
  it('removes all ipcRenderer.on listeners', async () => {
    const { link } = makeLink()
    link.on('a', vi.fn())
    link.on('b', vi.fn())

    await link.stop()

    expect(mockIpc.removeListener).toHaveBeenCalledTimes(2)
  })

  it('clears all internal state', async () => {
    const { link } = makeLink()
    link.on('a', vi.fn())
    await link.stop()

    expect(mockIpc.removeListener).toHaveBeenCalledTimes(1)
  })
})
