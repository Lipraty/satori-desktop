import type { Link } from '@satoriapp/link'
import { ref, shallowReactive } from 'vue'

export const store: Record<string, unknown> = shallowReactive({})
export const connected = ref(false)

export async function send<T>(type: string, ...args: any[]): Promise<T> {
  const ctx = (await import('.')).root
  return ctx.link.action(type, ...args)
}

export function connect(ctx: { link: Link, on: (event: string, cb: any) => () => void, emit: (event: string, data: any) => void }) {
  let disposed = false

  const dispose = ctx.on('link/send', (event: string, data: any) => {
    if (disposed)
      return
    ctx.emit(event, data)
  })

  connected.value = true

  return () => {
    disposed = true
    dispose()
    connected.value = false
  }
}
