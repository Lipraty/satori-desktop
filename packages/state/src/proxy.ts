export function makeDeepProxy<T>(
  target: T,
  onChange: (path: string, value: unknown) => void,
  _path = '',
): T {
  if (Array.isArray(target)) {
    return new Proxy(target, {
      set(arr, key, value: unknown) {
        Reflect.set(arr, key, value)
        // `length` is always set last during array mutations; emit once with a snapshot.
        if (key === 'length')
          onChange(_path, [...arr])
        return true
      },
    }) as T
  }

  if (target !== null && typeof target === 'object') {
    return new Proxy(target as Record<string | symbol, unknown>, {
      get(obj, key) {
        const val = Reflect.get(obj, key)
        if (typeof key !== 'string' || val === null || typeof val !== 'object')
          return val
        const childPath = _path ? `${_path}.${key}` : key
        return makeDeepProxy(val, onChange, childPath)
      },
      set(obj, key, value: unknown) {
        Reflect.set(obj, key, value)
        if (typeof key === 'string')
          onChange(_path ? `${_path}.${key}` : key, value)
        return true
      },
    }) as T
  }

  return target
}
