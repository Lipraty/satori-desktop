import { describe, expect, it, vi } from 'vitest'
import { makeDeepProxy } from '../src/proxy.js'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('makeDeepProxy — primitive set', () => {
  it('calls onChange with the correct path and value', () => {
    const raw = { x: 0 }
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw, onChange)

    proxy.x = 42

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('x', 42)
  })

  it('mutates the raw object in place', () => {
    const raw: Record<string, unknown> = {}
    const proxy = makeDeepProxy(raw, vi.fn())

    proxy.key = 'value'

    expect(raw.key).toBe('value')
  })

  it('does not call onChange on reads', () => {
    const onChange = vi.fn()
    const proxy = makeDeepProxy({ a: 1 }, onChange)
    void proxy.a

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('makeDeepProxy — nested set', () => {
  it('calls onChange with full dotted path', () => {
    const raw = { a: { b: { c: 0 } } }
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw, onChange)

    proxy.a.b.c = 99

    expect(onChange).toHaveBeenCalledWith('a.b.c', 99)
    expect(raw.a.b.c).toBe(99)
  })

  it('handles two levels of nesting', () => {
    const raw = { app: { window: { width: 0 } } }
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw, onChange)

    proxy.app.window.width = 1280

    expect(onChange).toHaveBeenCalledWith('app.window.width', 1280)
  })

  it('handles path prefix correctly', () => {
    const raw = { theme: 'light' as string }
    const onChange = vi.fn()
    // Simulate the namespace getter pattern: proxy with prefix 'app'
    const proxy = makeDeepProxy(raw, onChange, 'app')

    proxy.theme = 'dark'

    expect(onChange).toHaveBeenCalledWith('app.theme', 'dark')
  })
})

describe('makeDeepProxy — array mutations', () => {
  it('push: emits onChange with the full updated array', () => {
    const raw: Record<string, unknown[]> = { list: [] }
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw, onChange)

    proxy.list.push({ id: '1' })

    // Should emit for the 'list' path with the new array
    const call = onChange.mock.calls.find(c => c[0] === 'list')
    expect(call).toBeDefined()
    expect(call![1]).toEqual([{ id: '1' }])
  })

  it('push multiple items: emits for each push', () => {
    const raw: Record<string, unknown[]> = { items: [] }
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw, onChange)

    proxy.items.push('a')
    proxy.items.push('b')

    const listCalls = onChange.mock.calls.filter(c => c[0] === 'items')
    expect(listCalls).toHaveLength(2)
    expect(listCalls[1][1]).toEqual(['a', 'b'])
  })

  it('direct array assignment emits onChange immediately', () => {
    const raw: Record<string, unknown> = { arr: [] }
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw, onChange)

    proxy.arr = [1, 2, 3]

    expect(onChange).toHaveBeenCalledWith('arr', [1, 2, 3])
  })

  it('pop: emits with the updated array', () => {
    const raw: Record<string, unknown[]> = { list: ['a', 'b'] }
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw, onChange)

    proxy.list.pop()

    const call = onChange.mock.calls.find(c => c[0] === 'list')
    expect(call![1]).toEqual(['a'])
  })
})

describe('makeDeepProxy — read after write', () => {
  it('reads reflect written values through the proxy', () => {
    const raw = { a: { b: 0 } }
    const proxy = makeDeepProxy(raw, vi.fn())

    proxy.a.b = 42

    expect(proxy.a.b).toBe(42)
  })

  it('object assignment is reflected in reads', () => {
    const raw: Record<string, unknown> = {}
    const proxy = makeDeepProxy(raw, vi.fn())

    proxy.nested = { x: 1 }

    expect((proxy.nested as any).x).toBe(1)
  })
})

describe('makeDeepProxy — non-string keys', () => {
  it('symbol keys bypass onChange', () => {
    const sym = Symbol('test')
    const raw: Record<symbol, unknown> = {}
    const onChange = vi.fn()
    const proxy = makeDeepProxy(raw as any, onChange)

    ;(proxy as any)[sym] = 'sym-value'

    expect(onChange).not.toHaveBeenCalled()
    expect((raw as any)[sym]).toBe('sym-value')
  })
})

describe('makeDeepProxy — null and primitive passthrough', () => {
  it('null values are returned as-is (not proxied)', () => {
    const raw = { x: null as unknown }
    const proxy = makeDeepProxy(raw, vi.fn())
    expect(proxy.x).toBeNull()
  })

  it('proxying a non-object returns it unchanged', () => {
    expect(makeDeepProxy(42 as any, vi.fn())).toBe(42)
    expect(makeDeepProxy('str' as any, vi.fn())).toBe('str')
  })
})
