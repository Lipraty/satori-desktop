import { Context } from 'cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, LinkError } from '../src/index.js'

// ─── Mock Adapter ─────────────────────────────────────────────────────────────

class MockAdapter extends Link.Adapter {
  readonly handlers = new Map<string, Link.ActionHandler>()
  readonly listeners = new Map<string, ((data: unknown) => void)[]>()
  readonly broadcasts: Array<{ event: string, data: unknown }> = []
  disposed = false

  handle(path: string, handler: Link.ActionHandler): () => void {
    this.handlers.set(path, handler)
    return () => this.handlers.delete(path)
  }

  async invoke<T>(path: string, payload?: unknown): Promise<Link.Response<T>> {
    const handler = this.handlers.get(path)
    if (!handler)
      return { id: path, error: { code: Link.ErrorCode.ENOENT, message: `not found: ${path}` } }
    try {
      const data = await handler(payload)
      return { id: path, data: data as T }
    }
    catch (err) {
      return { id: path, error: { code: 'EINTERNAL', message: String(err) } }
    }
  }

  subscribe<T>(event: string, listener: (data: T) => void): () => void {
    const list = this.listeners.get(event) ?? []
    list.push(listener as (data: unknown) => void)
    this.listeners.set(event, list)
    return () => {
      const cur = this.listeners.get(event) ?? []
      this.listeners.set(event, cur.filter(l => l !== (listener as (data: unknown) => void)))
    }
  }

  broadcast(event: string, data: unknown): void {
    this.broadcasts.push({ event, data })
  }

  dispose(): void {
    this.disposed = true
    this.handlers.clear()
    this.listeners.clear()
  }

  /** Test helper — simulate a pushed event from server */
  push<T>(event: string, data: T): void {
    for (const listener of this.listeners.get(event) ?? []) listener(data)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setup(): { ctx: Context, svc: Link, adapter: MockAdapter } {
  const ctx = new Context()
  const svc = new Link(ctx)
  const adapter = new MockAdapter(ctx)
  svc.setAdapter(adapter)
  return { ctx, svc, adapter }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('link — no adapter', () => {
  let ctx: Context
  let svc: Link

  beforeEach(() => {
    ctx = new Context()
    svc = new Link(ctx)
  })

  it('is registered as ctx.link via plugin()', () => {
    const ctx2 = new Context()
    ctx2.plugin(Link)
    expect((ctx2 as any).link).toBeInstanceOf(Link)
  })

  it('throws ENOSYS on action()', async () => {
    await expect(svc.action('ping', {})).rejects.toMatchObject({ code: Link.ErrorCode.ENOSYS })
  })

  it('throws ENOSYS on on()', () => {
    expect(() => svc.on('event', () => {})).toThrow(LinkError)
  })

  it('throws ENOSYS on send()', () => {
    expect(() => svc.send('event', {})).toThrow(LinkError)
  })
})

describe('link — server-side: action(path, handler)', () => {
  it('registers a handler and returns a disposer', async () => {
    const { svc, adapter } = setup()
    const handler = vi.fn().mockResolvedValue({ pong: true })
    const dispose = svc.action('ping', handler)

    expect(typeof dispose).toBe('function')

    const res = await adapter.invoke<{ pong: boolean }>('ping', { ts: 1 })
    expect(handler).toHaveBeenCalledWith({ ts: 1 })
    expect(res.data).toEqual({ pong: true })
  })

  it('disposer removes the handler', async () => {
    const { svc, adapter } = setup()
    const dispose = svc.action('ping', vi.fn()) as () => void
    dispose()
    const res = await adapter.invoke('ping', {})
    expect(res.error?.code).toBe(Link.ErrorCode.ENOENT)
  })

  it('handler can be async', async () => {
    const { svc, adapter } = setup()
    svc.action('slow', async (p: any) => {
      await new Promise(r => setTimeout(r, 1))
      return { value: p.input * 2 }
    })
    const res = await adapter.invoke<{ value: number }>('slow', { input: 21 })
    expect(res.data?.value).toBe(42)
  })
})

describe('link — client-side: action(path, payload) → Promise', () => {
  it('invokes handler and returns unwrapped data', async () => {
    const { svc, adapter } = setup()
    adapter.handle('greet', (p: any) => ({ message: `hello ${p.name}` }))

    const result = await svc.action<{ message: string }>('greet', { name: 'world' })
    expect(result).toEqual({ message: 'hello world' })
  })

  it('throws when handler returns error response', async () => {
    const { svc } = setup()
    await expect(svc.action('missing', {})).rejects.toMatchObject({ code: Link.ErrorCode.ENOENT })
  })

  it('throws with the error code from response', async () => {
    const { svc, adapter } = setup()
    adapter.handle('fail', async () => {
      throw new Error('boom')
    })
    await expect(svc.action('fail', {})).rejects.toMatchObject({ code: 'EINTERNAL' })
  })

  it('passes undefined payload when omitted', async () => {
    const { svc, adapter } = setup()
    const handler = vi.fn().mockReturnValue({})
    adapter.handle('no-payload', handler)
    await svc.action('no-payload')
    expect(handler).toHaveBeenCalledWith(undefined)
  })
})

describe('link — on() / subscribe to server events', () => {
  it('calls listener when event is pushed', () => {
    const { svc, adapter } = setup()
    const listener = vi.fn()
    svc.on('message.created', listener)

    adapter.push('message.created', { id: '1', content: 'hi' })
    expect(listener).toHaveBeenCalledWith({ id: '1', content: 'hi' })
  })

  it('disposer stops future calls', () => {
    const { svc, adapter } = setup()
    const listener = vi.fn()
    const dispose = svc.on('msg', listener)
    dispose()

    adapter.push('msg', { id: '2' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('multiple listeners on same event all fire', () => {
    const { svc, adapter } = setup()
    const a = vi.fn()
    const b = vi.fn()
    svc.on('tick', a)
    svc.on('tick', b)
    adapter.push('tick', 1)
    expect(a).toHaveBeenCalledWith(1)
    expect(b).toHaveBeenCalledWith(1)
  })
})

describe('link — send() / broadcast', () => {
  it('records broadcast in adapter', () => {
    const { svc, adapter } = setup()
    svc.send('message.created', { id: '42' })
    expect(adapter.broadcasts).toEqual([{ event: 'message.created', data: { id: '42' } }])
  })

  it('can send multiple events', () => {
    const { svc, adapter } = setup()
    svc.send('a', 1)
    svc.send('b', 2)
    expect(adapter.broadcasts).toHaveLength(2)
  })
})

describe('link — setAdapter()', () => {
  it('replaces adapter and disposes the old one', () => {
    const { ctx, svc, adapter: old } = setup()
    const next = new MockAdapter(ctx)
    svc.setAdapter(next)
    expect(old.disposed).toBe(true)
    expect(svc.adapter).toBe(next)
  })
})

describe('link — stop()', () => {
  it('disposes the adapter and clears the reference', async () => {
    const { svc, adapter } = setup()
    await svc.stop()
    expect(adapter.disposed).toBe(true)
    expect(svc.adapter).toBeUndefined()
  })

  it('subsequent stop() is a no-op', async () => {
    const { svc } = setup()
    await svc.stop()
    await expect(svc.stop()).resolves.toBeUndefined()
  })
})

describe('link — adapter getter', () => {
  it('returns installed adapter', () => {
    const { svc, adapter } = setup()
    expect(svc.adapter).toBe(adapter)
  })

  it('returns undefined before setAdapter()', () => {
    const ctx = new Context()
    const svc = new Link(ctx)
    expect(svc.adapter).toBeUndefined()
  })
})

describe('link — ctx.link augmentation', () => {
  it('ctx.link is accessible after plugin()', () => {
    const ctx = new Context()
    ctx.plugin(Link)
    expect((ctx as any).link).toBeInstanceOf(Link)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
