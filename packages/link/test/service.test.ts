import { Context } from 'cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Link } from '../src/index.js'

class TestLink extends Link {
  readonly handlers = new Map<string, Link.ActionHandler>()
  readonly broadcasts: Array<{ event: string, data: unknown }> = []
  disposed = false

  constructor(ctx: Context) {
    super(ctx)
    ctx.on('link/send', (event, data) => {
      this.broadcasts.push({ event, data })
      for (const l of this.eventListeners.get(event) ?? []) l(data)
    })
  }

  async stop(): Promise<void> {
    this.disposed = true
    this.handlers.clear()
    this.eventListeners.clear()
  }

  protected handle(path: string, handler: Link.ActionHandler): () => void {
    this.handlers.set(path, handler)
    return () => this.handlers.delete(path)
  }

  protected async call<T>(path: string, payload?: unknown): Promise<Link.Response<T>> {
    const handler = this.handlers.get(path)
    if (!handler)
      return { id: path, error: { code: Link.ErrorCode.ENOENT, message: `not found: ${path}` } }
    try {
      const data = await handler(payload)
      return { id: path, data: data as T }
    }
    catch (err) {
      return { id: path, error: { code: Link.ErrorCode.EINTERNAL, message: String(err) } }
    }
  }
}

function setup(): { ctx: Context, svc: TestLink } {
  const ctx = new Context()
  const svc = new TestLink(ctx)
  return { ctx, svc }
}

describe('link — server-side: action(path, handler)', () => {
  it('registers a handler and returns a disposer', async () => {
    const { svc } = setup()
    const handler = vi.fn().mockResolvedValue({ pong: true })
    const dispose = svc.action('ping', handler)

    expect(typeof dispose).toBe('function')

    const res = await svc.call<{ pong: boolean }>('ping', { ts: 1 })
    expect(handler).toHaveBeenCalledWith({ ts: 1 })
    expect(res.data).toEqual({ pong: true })
  })

  it('disposer removes the handler', async () => {
    const { svc } = setup()
    const dispose = svc.action('ping', vi.fn()) as () => void
    dispose()
    const res = await svc.call('ping', {})
    expect(res.error?.code).toBe(Link.ErrorCode.ENOENT)
  })

  it('handler can be async', async () => {
    const { svc } = setup()
    svc.action('slow', async (p: any) => {
      await new Promise(r => setTimeout(r, 1))
      return { value: p.input * 2 }
    })
    const res = await svc.call<{ value: number }>('slow', { input: 21 })
    expect(res.data?.value).toBe(42)
  })
})

describe('link — client-side: action(path, payload) → Promise', () => {
  it('invokes handler and returns unwrapped data', async () => {
    const { svc } = setup()
    svc.action('greet', (p: any) => ({ message: `hello ${p.name}` }))

    const result = await svc.action<{ message: string }>('greet', { name: 'world' })
    expect(result).toEqual({ message: 'hello world' })
  })

  it('throws when handler returns error response', async () => {
    const { svc } = setup()
    await expect(svc.action('missing', {})).rejects.toMatchObject({ code: Link.ErrorCode.ENOENT })
  })

  it('throws with the error code from response', async () => {
    const { svc } = setup()
    svc.action('fail', async () => {
      throw new Error('boom')
    })
    await expect(svc.action('fail', {})).rejects.toMatchObject({ code: Link.ErrorCode.EINTERNAL })
  })

  it('passes undefined payload when omitted', async () => {
    const { svc } = setup()
    const handler = vi.fn().mockReturnValue({})
    svc.action('no-payload', handler)
    await svc.action('no-payload')
    expect(handler).toHaveBeenCalledWith(undefined)
  })
})

describe('link — on() / subscribe to events', () => {
  it('calls listener when event is pushed', () => {
    const { ctx, svc } = setup()
    const listener = vi.fn()
    svc.on('message.created', listener)

    ctx.emit('link/send', 'message.created', { id: '1', content: 'hi' })
    expect(listener).toHaveBeenCalledWith({ id: '1', content: 'hi' })
  })

  it('disposer stops future calls', () => {
    const { ctx, svc } = setup()
    const listener = vi.fn()
    const dispose = svc.on('msg', listener)
    dispose()

    ctx.emit('link/send', 'msg', { id: '2' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('multiple listeners on same event all fire', () => {
    const { ctx, svc } = setup()
    const a = vi.fn()
    const b = vi.fn()
    svc.on('tick', a)
    svc.on('tick', b)
    ctx.emit('link/send', 'tick', 1)
    expect(a).toHaveBeenCalledWith(1)
    expect(b).toHaveBeenCalledWith(1)
  })
})

describe('link — link/send event broadcast', () => {
  it('records broadcast via link/send', () => {
    const { ctx, svc } = setup()
    ctx.emit('link/send', 'message.created', { id: '42' })
    expect(svc.broadcasts).toEqual([{ event: 'message.created', data: { id: '42' } }])
  })

  it('can emit multiple events', () => {
    const { ctx, svc } = setup()
    ctx.emit('link/send', 'a', 1)
    ctx.emit('link/send', 'b', 2)
    expect(svc.broadcasts).toHaveLength(2)
  })
})

describe('link — stop()', () => {
  it('disposes internal state', async () => {
    const { svc } = setup()
    await svc.stop()
    expect(svc.disposed).toBe(true)
  })

  it('subsequent stop() is a no-op', async () => {
    const { svc } = setup()
    await svc.stop()
    await expect(svc.stop()).resolves.toBeUndefined()
  })
})

describe('link — ctx.link augmentation', () => {
  it('ctx.link is accessible after plugin()', () => {
    const ctx = new Context()
    ctx.plugin(TestLink)
    expect((ctx as any).link).toBeDefined()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
