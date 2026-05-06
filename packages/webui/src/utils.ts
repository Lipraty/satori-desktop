import { markRaw } from 'vue'

export interface Ordered {
  order?: number
}

export function insert<T extends Ordered>(list: T[], item: T) {
  markRaw(item)
  const order = item.order ?? 0
  const index = list.findIndex(i => (i.order ?? 0) < order)
  if (index >= 0)
    list.splice(index, 0, item)
  else list.push(item)
}

export function generateId(inputStr: string) {
  const hash = (str: string) => {
    let h = 5381
    for (let i = 0; i < str.length; i++) {
      h = (h * 33) ^ str.charCodeAt(i)
    }
    return h >>> 0
  }
  const max36 = 36 ** 6 - 1
  const numericHash = hash(inputStr) % (max36 + 1)
  return numericHash.toString(36).padStart(6, '0').slice(0, 6)
}
