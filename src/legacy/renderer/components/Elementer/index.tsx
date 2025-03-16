import { Element } from "@satorijs/core";
import { createElement } from "react";

import { EAudio } from "./Audio";
import { EVideo } from "./Video";
import { EQuote } from "./Quote";
import { EAuthor } from "./Author";
import { EImage } from "./Image";

import './style.scss'

export interface Elementer {
  handles: Record<string, (element: Element) => React.ReactNode | JSX.Element>
  addHandle: (type: string | string[], handle: (element: Element) => React.ReactNode | JSX.Element) => void
  renderer: (element: Element) => React.ReactNode | JSX.Element
}

export const Elementer: Elementer = {
  handles: {},
  addHandle: (type, handle) => {
    if (Array.isArray(type)) {
      type.forEach(t => Elementer.handles[t] = handle)
    } else {
      Elementer.handles[type] = handle
    }
  },
  renderer: (element) => {
    const { type } = element
    const handle = Elementer.handles[type]
    if (handle) {
      return handle(element)
    }
    return <span className="elementer-unknown">Unknown element: {element.type}</span>;
  }
}

Elementer.addHandle('text', (element) => {
  return <span className="elementer-text">{element.attrs.content}</span>
})

Elementer.addHandle('at', (element) => {
  return <span className="elementer-at">@{element.attrs.name}</span>
})

Elementer.addHandle('sharp', (element) => {
  return <span className="elementer-sharp">#{element.attrs.name}</span>
})

Elementer.addHandle('a', (element) => {
  return <a href={element.attrs.href}>{element.attrs.href}</a>
})

Elementer.addHandle('img', (element) => {
  const { src, name, width, height } = element.attrs
  return <EImage src={src} title={name} width={width} height={height} />
})

Elementer.addHandle('audio', (element) => {
  return <EAudio src={element.attrs.src} />
})

Elementer.addHandle('video', (element) => {
  return <EVideo src={element.attrs.src} />
})

Elementer.addHandle(['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'del', 'code', 'sup', 'sub'], (element) => {
  return createElement(element.type, { className: `elementer-${element.type}` })
})

Elementer.addHandle('br', () => {
  return <br />
})

Elementer.addHandle('p', (element) => {
  return <p className="elementer-p">{element.children.map(Elementer.renderer)}</p>
})

Elementer.addHandle('quote', (element) => {
  return <EQuote>{element.children.map(Elementer.renderer)}</EQuote>
})

Elementer.addHandle('author', (element) => {
  return <EAuthor id={element.attrs.id} avatar={element.attrs.avatar} name={element.attrs.name} />
})
