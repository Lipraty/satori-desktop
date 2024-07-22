import { Element } from "@satorijs/core";
import { createElement } from "react";

import { EAudio } from "./Audio";
import { EVideo } from "./Video";
import { EQuote } from "./Quote";
import { EAuthor } from "./Author";
// formatter
import * as chronocat from './external/chronocat'

import './style.scss'

const formatters = [
  chronocat
]

export const Elementer = (element: Element) => {
  const { attrs, children, type } = element

  switch (type) {
    // base element
    case 'text':
      return <span className="elementer-text">{attrs.content}</span>
    case 'at':
      return <span className="elementer-at">@{attrs.name}</span>
    case 'sharp':
      return <span className="elementer-sharp">#{attrs.name}</span>
    case 'a':
      return <a href={attrs.href}>{attrs.href}</a>
    // source
    case 'img':
      return <img className="elementer-img" src={attrs.src} alt={attrs.name} width={attrs.width} height={attrs.height}></img>
    case 'audio':
      return <EAudio src={attrs.src} />
    case 'video':
      return <EVideo src={attrs.src} />
    // Modifying
    case 'b':
    case 'strong':
    case 'i':
    case 'em':
    case 'u':
    case 'ins':
    case 's':
    case 'del':
    case 'code':
    case 'sup':
    case 'sub':
      return createElement(type, { className: `elementer-${type}` })
    case 'br':
      return <br />
    case 'p':
      return <p className="elementer-p">{children.map(Elementer)}</p>
    // metadata
    case 'quote':
      return <EQuote>{children.map(Elementer)}</EQuote>
    case 'author':
      return <EAuthor id={attrs.id} avatar={attrs.avatar} name={attrs.name} />
    // interaction
    default:
      // if (type.includes(':')) {
      //   const [namespace, _type] = type.split(':')
      //   const formatter = formatters.find(formatter => formatter.selfTag === namespace)
      //   if (formatter) {
      //     const result = formatter[namespace](_type, attrs, children)
      //     if (result) return result
      //   }
      // }
      return <span className="elementer-unknown">Unknown element: {type}</span>
  }
}
