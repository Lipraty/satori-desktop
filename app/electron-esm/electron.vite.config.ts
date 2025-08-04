import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

import jsonImportAttributesPlugin from './vite/vite-plugin-import-attr'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      jsonImportAttributesPlugin({
        force: true,
        minNodeVersion: 22,
        extensions: ['.json'],
        debug: true,
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
  },
})
