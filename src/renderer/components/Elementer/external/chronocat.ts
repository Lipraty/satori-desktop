import { Element } from "@satorijs/core";

export const selfTag = 'chronocat'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const chronocat = (type: string, attrs: any[], children: Element[]): Element[] | boolean => {
  switch (type) {
    case 'marketface':
    case 'face':
      return children.filter(e => e.type === 'img')
    default:
      return false
  }
}