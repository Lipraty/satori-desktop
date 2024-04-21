/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Cordis from 'cordis'
import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import * as MainApp from './client/App'

export type Events<C extends Context> = Cordis.Events<C>

export interface Internal {}

export interface Context {
  [Context.events]: Events<this>
  internal: Internal
}

export interface PageOptions {
  $root?: boolean
  path: string
  component: React.ComponentType
}

export const AppContext = React.createContext('app')

export class Context extends Cordis.Context {
  react: typeof React
  App: React.Context<string>

  #slots: Record<string, React.ComponentType> = {}

  constructor(rootDOM: HTMLElement) {
    super()
    this.internal = {} as Internal

    this.react = React
    this.App = AppContext

    this.on('ready', ()=>{
      const root = createRoot(rootDOM)
      root.render(
        
      )
      this.plugin(MainApp)
    })
  }

  addEventListener(type: any, listener: (this: Window, ev: unknown) => unknown, options: boolean | AddEventListenerOptions | undefined) {
    this.react.useEffect(() => {
      window.addEventListener(type, listener, options);
      return () => window.removeEventListener(type, listener, options);
    }, [type, listener, options]);
  }

  warpComponent(component: React.ComponentType) {
    if (!component) return
    return this.react.createElement(this.App.Provider, null, this.react.createElement(component))
  }

  page(options: PageOptions) {
    
  }
}
