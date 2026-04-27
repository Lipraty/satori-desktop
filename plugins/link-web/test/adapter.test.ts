import { Link } from '@satoriapp/link'
import { Context } from 'cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkWsClient } from '../src/index.js'

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

const mockFetch = vi.fn<typeof fetch>()

async function makeLink(baseUrl = 'http://localhost:3000') {
  const ctx = new Context()
  const link = new LinkWsClient(ctx, { baseUrl })
  await link.start()
  return { ctx, link }
}

function lastWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1]
}

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

describe('linkWsClient — start()', () => {
  it('opens a WebSocket on start', async () => {
    const { link } = await makeLink('http://localhost:3000')
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(lastWs().url).toBe('ws://localhost:3000')
    void link.stop()
  })

  it('converts https:// to wss://', async () => {
    const { link } = await makeLink('https://example.com')
    expect(lastWs().url).toBe('wss://example.com')
    void link.stop()
  })

  it('emits link/status connecting on start', async () => {
    const ctx = new Context()
    const statusEvents: string[] = []
    ctx.on('link/status', s => statusEvents.push(s))
    const link = new LinkWsClient(ctx, { baseUrl: 'http://localhost:3000' })
    await link.start()
    expect(statusEvents).toContain('connecting')
    void link.stop()
  })
})

describe('linkWsClient — action() invoke', () => {
  it('sends a POST to the correct URL', async () => {
    const { link } = await makeLink('http://localhost:3000')
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await link.action('ping', { ts: 1 })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/ping',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ts: 1 }),
      }),
    )
    void link.stop()
  })

  it('strips leading slash from path', async () => {
    const { link } = await makeLink('http://localhost:3000')
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))

    await link.action('/ping', {})
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/ping', expect.anything())
    void link.stop()
  })

  it('trims trailing slash from baseUrl', async () => {
    const { link } = await makeLink('http://localhost:3000/')
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))

    await link.action('ping', {})
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/ping', expect.anything())
    void link.stop()
  })

  it('returns data on 200 OK', async () => {
    const { link } = await makeLink()
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ pong: true }), { status: 200 }))

    const result = await link.action('ping')
    expect(result).toEqual({ pong: true })
    void link.stop()
  })

  it('throws on non-OK status', async () => {
    const { link } = await makeLink()
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 404, statusText: 'Not Found' }))

    await expect(link.action('missing')).rejects.toMatchObject({
      code: '404',
      message: 'Not Found',
    })
    void link.stop()
  })

  it('throws ENOTCONN on fetch rejection', async () => {
    const { link } = await makeLink()
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    await expect(link.action('ping')).rejects.toMatchObject({
      code: Link.ErrorCode.ENOTCONN,
      message: 'network error',
    })
    void link.stop()
  })

  it('throws ETIMEOUT when fetch hangs past ACTION_TIMEOUT_MS', async () => {
    vi.useFakeTimers()
    const { link } = await makeLink()
    mockFetch.mockImplementationOnce(() => new Promise(() => {}))

    const invokePromise = link.action('slow')
    vi.advanceTimersByTime(16_000)
    await expect(invokePromise).rejects.toMatchObject({ code: Link.ErrorCode.ETIMEOUT })
    void link.stop()
    vi.useRealTimers()
  })
})

describe('linkWsClient — on() subscribe', () => {
  it('delivers a pushed event to all subscribers', async () => {
    const { link } = await makeLink()
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    link.on('message.created', listenerA)
    link.on('message.created', listenerB)

    lastWs().simulateMessage({ event: 'message.created', data: { id: '1' } })

    expect(listenerA).toHaveBeenCalledWith({ id: '1' })
    expect(listenerB).toHaveBeenCalledWith({ id: '1' })
    void link.stop()
  })

  it('does not deliver events to wrong channel subscribers', async () => {
    const { link } = await makeLink()
    const listener = vi.fn()
    link.on('other.event', listener)

    lastWs().simulateMessage({ event: 'message.created', data: { id: '1' } })

    expect(listener).not.toHaveBeenCalled()
    void link.stop()
  })

  it('disposer stops event delivery', async () => {
    const { link } = await makeLink()
    const listener = vi.fn()
    const dispose = link.on('tick', listener)

    lastWs().simulateMessage({ event: 'tick', data: 1 })
    expect(listener).toHaveBeenCalledTimes(1)

    dispose()
    lastWs().simulateMessage({ event: 'tick', data: 2 })
    expect(listener).toHaveBeenCalledTimes(1)
    void link.stop()
  })

  it('partial dispose keeps other listeners active', async () => {
    const { link } = await makeLink()
    const a = vi.fn()
    const b = vi.fn()
    const disposeA = link.on('msg', a)
    link.on('msg', b)

    disposeA()
    lastWs().simulateMessage({ event: 'msg', data: 'hello' })

    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledWith('hello')
    void link.stop()
  })

  it('silently ignores malformed JSON messages', async () => {
    const { link } = await makeLink()
    link.on('x', vi.fn())

    expect(() => {
      lastWs().onmessage?.({ data: 'not-json{{{' })
    }).not.toThrow()
    void link.stop()
  })
})

describe('linkWsClient — reconnect', () => {
  it('schedules reconnect after disconnect', async () => {
    vi.useFakeTimers()
    const { link } = await makeLink()
    const firstWs = lastWs()
    firstWs.simulateOpen()

    firstWs.simulateClose()
    expect(MockWebSocket.instances).toHaveLength(1)

    vi.advanceTimersByTime(1_500)
    expect(MockWebSocket.instances).toHaveLength(2)

    void link.stop()
    vi.useRealTimers()
  })

  it('uses exponential backoff delays', async () => {
    vi.useFakeTimers()
    const { link } = await makeLink()

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

    void link.stop()
    vi.useRealTimers()
  })

  it('resets retry count after successful connection', async () => {
    vi.useFakeTimers()
    const { link } = await makeLink()

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

    void link.stop()
    vi.useRealTimers()
  })

  it('emits link/status events correctly', async () => {
    vi.useFakeTimers()
    const ctx = new Context()
    const statuses: string[] = []
    ctx.on('link/status', s => statuses.push(s))
    const link = new LinkWsClient(ctx, { baseUrl: 'http://localhost:3000' })
    await link.start()

    lastWs().simulateOpen()
    lastWs().simulateClose()
    vi.advanceTimersByTime(1_001)

    expect(statuses).toEqual(['connecting', 'connected', 'disconnected', 'connecting'])

    void link.stop()
    vi.useRealTimers()
  })
})

describe('linkWsClient — stop()', () => {
  it('closes the WebSocket', async () => {
    const { link } = await makeLink()
    const ws = lastWs()

    await link.stop()

    expect(ws.closed).toBe(true)
  })

  it('does not reconnect after stop', async () => {
    vi.useFakeTimers()
    const { link } = await makeLink()
    const ws = lastWs()

    void link.stop()
    ws.simulateClose()

    vi.advanceTimersByTime(5_000)
    expect(MockWebSocket.instances).toHaveLength(1)
    vi.useRealTimers()
  })

  it('clears all subscribers', async () => {
    const { link } = await makeLink()
    const listener = vi.fn()
    link.on('msg', listener)

    await link.stop()
    lastWs().simulateMessage({ event: 'msg', data: 'hi' })

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('linkWsClient — server-side stubs', () => {
  it('action(path, handler) is a no-op and returns a disposer', async () => {
    const { link } = await makeLink()
    const dispose = link.action('path', vi.fn())
    expect(typeof dispose).toBe('function')
    expect(() => dispose()).not.toThrow()
    void link.stop()
  })
})
