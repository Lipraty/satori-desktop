import type { Context, Service as CordisService } from 'cordis'
import type { InjectionKey, Ref } from 'vue'
import { inject, markRaw, onScopeDispose, ref } from 'vue'

export const kContext = Symbol('context') as InjectionKey<Context>

export function useContext(): Context {
  const parent = inject(kContext)!
  const fiber = parent.plugin(() => {})
  onScopeDispose(fiber.dispose)
  return fiber.ctx
}

export function useInject<K extends string & keyof Context>(name: K): Ref<Context[K] | undefined> {
  const parent = inject(kContext)!
  function wrap(v: Context[K] | undefined): Context[K] | undefined {
    if (v !== null && typeof v === 'object') {
      markRaw(v as object)
    }
    return v
  }
  const service = ref(wrap(parent.get(name))) as Ref<Context[K] | undefined>
  onScopeDispose(parent.on('internal/service', () => {
    service.value = wrap(parent.get(name))
  }))
  return service
}

export type { Context }
export type { CordisService as Service }
