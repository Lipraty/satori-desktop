import type { Context as CordisContext } from 'cordis'
import { Context, Fiber, Service } from 'cordis'
import type {} from '@cordisjs/plugin-loader'
import { inject, InjectionKey, markRaw, onScopeDispose, Ref, ref } from 'vue'

declare module 'cordis' {
  interface Events {
    'app-state-updated': (data: { owner_id: string, delta: any, timestamp: number }) => void
  }
}

export const kContext = Symbol('context') as InjectionKey<CordisContext>

export function useContext() {
  const parent = inject(kContext)!
  const fiber = parent.plugin(() => {})
  onScopeDispose(fiber.dispose)
  return fiber.ctx as CordisContext
}

export function useInject<K extends string & keyof CordisContext>(name: K): Ref<CordisContext[K]> {
  const parent = inject(kContext)!
  const initial = parent.get(name)
  const service = ref<any>(typeof initial === 'object' && initial ? markRaw(initial) : initial)
  onScopeDispose(parent.on('internal/service', () => {
    const value = parent.get(name)
    service.value = typeof value === 'object' && value ? markRaw(value) : value
  }))
  return service
}

export function useRpc<T>(): Ref<T> {
  const parent = inject(kContext)!
  return parent.$entry!.data
}

markRaw(Context.prototype)
markRaw(Fiber.prototype)
markRaw(Service.prototype)
