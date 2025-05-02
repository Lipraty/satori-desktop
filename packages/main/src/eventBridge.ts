import type { Context, Events as MainEvents } from '.'
import type { } from './ipc'

declare module '@satoriapp/common' {
  interface IpcEvents {
    'internal:event': (name: keyof MainEvents<Context>, args: any[]) => void
  }
}

export const name = 'event-bridge'

export const inject = ['ipc', 'window']

export function apply(ctx: Context) {
  ctx.on('internal/event', (type, name, args) => {
    if (type === 'emit' && !name.startsWith('internal/')) {
      ctx.ipc.sendAll('internal:event', name as keyof MainEvents<Context>, argsFormat(args))
    }
  })
}

export function argsFormat(args: any[]): any[] {
  const sanitize = (val: any): any => {
    if (val === null || val === undefined) return val;
    const t = typeof val;
    if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint') {
      return val;
    }
    if (t === 'symbol') {
      return `[Symbol: ${String(val.description ?? '')}]`;
    }
    if (t === 'function') {
      return `[Function: ${val.name || 'anonymous'}]`;
    }
    if (
      val instanceof Date ||
      val instanceof RegExp ||
      val instanceof ArrayBuffer ||
      ArrayBuffer.isView(val) ||     // TypedArray / DataView
      val instanceof Map ||
      val instanceof Set ||
      (
        val instanceof Error &&
        ['Error','EvalError','RangeError','ReferenceError','SyntaxError','TypeError','URIError']
          .includes(val.name)
      )
    ) {
      return val;
    }
    if (val instanceof WeakMap) return '[WeakMap]';
    if (val instanceof WeakSet) return '[WeakSet]';
    if (Array.isArray(val)) {
      return val.map(sanitize);
    }
    if (t === 'object') {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = sanitize(v);
      }
      return out;
    }
    return `[Unknown: ${Object.prototype.toString.call(val)}]`;
  };
  return args.map(sanitize);
}
