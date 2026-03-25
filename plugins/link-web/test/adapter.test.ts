import { Link } from '@satoriapp/link'
import { Context } from 'cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WsClientAdapter } from '../src/index.js'

// ─── Mock WebSocket ────────────────────────────────────────────────────────────

class MockWebSocket {
  static instances: MockWebSocket[] = []

  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null

  readonly url: string
  closed = false

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  close() {
    this.closed = true
  }

  simulateOpen() {
    this.onopen?.()
  }

  simulateClose() {
    this.onclose?.()
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateError() {
    this.onerror?.()
  }
}

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn<typeof fetch>()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAdapter(baseUrl = 'http://localhost:3000') {
  const ctx = new Context()
  const adapter = new WsClientAdapter(ctx, baseUrl)
  return { ctx, adapter }
}

function lastWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1]
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  MockWebSocket.instances = []
  ;(globalThis as Record<string, unknown>).WebSocket = MockWebSocket
  ;(globalThis as Record<string, unknown>).fetch = mockFetch
  vi.clearAllMocks()
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).WebSocket
  delete (globalThis as Record<string, unknown>).fetch
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('wsClientAdapter — constructor', () => {
  it('opens a WebSocket on construction', () => {
    makeAdapter('http://localhost:3000')
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(lastWs().url).toBe('ws://localhost:3000')
  })

  it('converts https:// to wss://', () => {
    makeAdapter('https://example.com')
    expect(lastWs().url).toBe('wss://example.com')
  })

  it('emits link/status connecting on construction', () => {
    const ctx = new Context()
    const statusEvents: string[] = []
    ctx.on('link/status', s => statusEvents.push(s))
    const _adapter = new WsClientAdapter(ctx, 'http://localhost:3000')
    expect(statusEvents).toContain('connecting')
  })
})

describe('wsClientAdapter — invoke()', () => {
  it('sends a POST to the correct URL', async () => {
    const { adapter } = makeAdapter('http://localhost:3000')
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await adapter.invoke('ping', { ts: 1 })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/ping',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ts: 1 }),
      }),
    )
  })

  it('strips leading slash from path', async () => {
    const { adapter } = makeAdapter('http://localhost:3000')
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))

    await adapter.invoke('/ping', {})
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/ping', expect.anything())
  })

  it('trims trailing slash from baseUrl', async () => {
    const { adapter } = makeAdapter('http://localhost:3000/')
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))

    await adapter.invoke('ping', {})
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/ping', expect.anything())
  })

  it('returns data on 200 OK', async () => {
    const { adapter } = makeAdapter()
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ pong: true }), { status: 200 }))

    const res = await adapter.invoke('ping')
    expect(res.data).toEqual({ pong: true })
    expect(res.error).toBeUndefined()
  })

  it('returns error on non-OK status', async () => {
    const { adapter } = makeAdapter()
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 404, statusText: 'Not Found' }))

    const res = await adapter.invoke('missing')
    expect(res.error?.code).toBe('404')
    expect(res.error?.message).toBe('Not Found')
  })

  it('returns ENOTCONN on fetch rejection', async () => {
    const { adapter } = makeAdapter()
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    const res = await adapter.invoke('ping')
    expect(res.error?.code).toBe(Link.ErrorCode.ENOTCONN)
    expect(res.error?.message).toBe('network error')
  })

  it('returns ETIMEOUT when fetch hangs past ACTION_TIMEOUT_MS', async () => {
    vi.useFakeTimers()
    const { adapter } = makeAdapter()
    mockFetch.mockImplementationOnce(() => new Promise(() => {})) // never resolves

    const invokePromise = adapter.invoke('slow')
    vi.advanceTimersByTime(16_000)
    const res = await invokePromise

    expect(res.error?.code).toBe(Link.ErrorCode.ETIMEOUT)
    vi.useRealTimers()
  })
})

describe('wsClientAdapter — subscribe()', () => {
  it('delivers a pushed event to all subscribers', () => {
    const { adapter } = makeAdapter()
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    adapter.subscribe('message.created', listenerA)
    adapter.subscribe('message.created', listenerB)

    lastWs().simulateMessage({ event: 'message.created', data: { id: '1' } })

    expect(listenerA).toHaveBeenCalledWith({ id: '1' })
    expect(listenerB).toHaveBeenCalledWith({ id: '1' })
  })

  it('does not deliver events to wrong channel subscribers', () => {
    const { adapter } = makeAdapter()
    const listener = vi.fn()
    adapter.subscribe('other.event', listener)

    lastWs().simulateMessage({ event: 'message.created', data: { id: '1' } })

    expect(listener).not.toHaveBeenCalled()
  })

  it('disposer stops event delivery', () => {
    const { adapter } = makeAdapter()
    const listener = vi.fn()
    const dispose = adapter.subscribe('tick', listener)

    lastWs().simulateMessage({ event: 'tick', data: 1 })
    expect(listener).toHaveBeenCalledTimes(1)

    dispose()
    lastWs().simulateMessage({ event: 'tick', data: 2 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('partial dispose keeps other listeners active', () => {
    const { adapter } = makeAdapter()
    const a = vi.fn()
    const b = vi.fn()
    const disposeA = adapter.subscribe('msg', a)
    adapter.subscribe('msg', b)

    disposeA()
    lastWs().simulateMessage({ event: 'msg', data: 'hello' })

    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledWith('hello')
  })

  it('silently ignores malformed JSON messages', () => {
    const { adapter } = makeAdapter()
    adapter.subscribe('x', vi.fn())

    expect(() => {
      lastWs().onmessage?.({ data: 'not-json{{{' })
    }).not.toThrow()
  })
})

describe('wsClientAdapter — reconnect', () => {
  it('schedules reconnect after disconnect', () => {
    vi.useFakeTimers()
    const { adapter } = makeAdapter()
    const firstWs = lastWs()
    firstWs.simulateOpen()

    firstWs.simulateClose()
    expect(MockWebSocket.instances).toHaveLength(1)

    vi.advanceTimersByTime(1_500)
    expect(MockWebSocket.instances).toHaveLength(2)

    adapter.dispose()
    vi.useRealTimers()
  })

  it('uses exponential backoff delays', () => {
    vi.useFakeTimers()
    const { adapter } = makeAdapter()

    lastWs().simulateClose()
    vi.advanceTimersByTime(999)
    expect(MockWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(MockWebSocket.instances).toHaveLength(2)

    lastWs().simulateClose()
    vi.advanceTimersByTime(1999)
    expect(MockWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(2)
    expect(MockWebSocket.instances).toHaveLength(3)

    adapter.dispose()
    vi.useRealTimers()
  })

  it('resets retry count after successful connection', () => {
    vi.useFakeTimers()
    const { adapter } = makeAdapter()

    lastWs().simulateClose()
    vi.advanceTimersByTime(1_001)
    lastWs().simulateClose()
    vi.advanceTimersByTime(2_001)

    lastWs().simulateOpen()

    lastWs().simulateClose()
    vi.advanceTimersByTime(999)
    expect(MockWebSocket.instances).toHaveLength(3)
    vi.advanceTimersByTime(2)
    expect(MockWebSocket.instances).toHaveLength(4)

    adapter.dispose()
    vi.useRealTimers()
  })

  it('emits link/status events correctly', () => {
    vi.useFakeTimers()
    const ctx = new Context()
    const statuses: string[] = []
    ctx.on('link/status', s => statuses.push(s))
    const adapter = new WsClientAdapter(ctx, 'http://localhost:3000')

    lastWs().simulateOpen()
    lastWs().simulateClose()
    vi.advanceTimersByTime(1_001)

    expect(statuses).toEqual(['connecting', 'connected', 'disconnected', 'connecting'])

    adapter.dispose()
    vi.useRealTimers()
  })
})

describe('wsClientAdapter — dispose()', () => {
  it('closes the WebSocket', () => {
    const { adapter } = makeAdapter()
    const ws = lastWs()

    adapter.dispose()

    expect(ws.closed).toBe(true)
  })

  it('does not reconnect after dispose', () => {
    vi.useFakeTimers()
    const { adapter } = makeAdapter()
    const ws = lastWs()

    adapter.dispose()
    ws.simulateClose()

    vi.advanceTimersByTime(5_000)
    expect(MockWebSocket.instances).toHaveLength(1)
    vi.useRealTimers()
  })

  it('clears all subscribers', () => {
    const { adapter } = makeAdapter()
    const listener = vi.fn()
    adapter.subscribe('msg', listener)

    adapter.dispose()
    lastWs().simulateMessage({ event: 'msg', data: 'hi' })

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('wsClientAdapter — server-side stubs', () => {
  it('handle() logs a warning and returns a disposer', () => {
    const { adapter } = makeAdapter()
    const dispose = adapter.handle('path', vi.fn())
    expect(typeof dispose).toBe('function')
    expect(() => dispose()).not.toThrow()
  })

  it('broadcast() logs a warning and does not throw', () => {
    const { adapter } = makeAdapter()
    expect(() => adapter.broadcast('event', {})).not.toThrow()
  })
})
