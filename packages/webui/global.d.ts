/// <reference types="vite/client" />

declare module '*.vue' {
  import type { Component } from 'vue'

  const component: Component
  export default component
}

declare namespace globalThis {
  interface Window {
    electron: {
      process: any
      ipcRenderer: any
      webFrame: any
      webUtils: any
    }
    cirno?: any
  }
}
