import { useRef, useEffect } from "react"

export interface WatchOptions {
  immediate?: boolean
}

export type WatchCallback<T> = (newValue: T, oldValue?: T) => void

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint, @typescript-eslint/no-explicit-any
export const useWatch = <T extends any>(value: T, callback: WatchCallback<T>, options: WatchOptions = { immediate: false }) => {
  const oldValue = useRef<T>()
  const isFirst = useRef(false)
  useEffect(() => {
    if (isFirst.current) {
      callback(value, oldValue.current)
    } else {
      isFirst.current = true
      if (options.immediate) {
        callback(value, oldValue.current)
      }
    }

    oldValue.current = value
  }, [value])
}
