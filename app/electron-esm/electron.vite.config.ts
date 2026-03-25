import { resolve } from 'node:path'
import yaml from '@rollup/plugin-yaml'
import vue from '@vitejs/plugin-vue'
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
    plugins: [yaml() as any, vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('fluent-'),
        },
      },
    })],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@satoriapp/webui': resolve('../../packages/webui/src/index.ts'),
        '@plugin/link-ipc': resolve('../../plugins/link-ipc/src/client.ts'),
        '@plugin/link-ws': resolve('../../plugins/link-web/src/client.ts'),
        '@plugin/client-messages': resolve('../../plugins/client-messages/client/index.ts'),
        '@plugin/client-network': resolve('../../plugins/client-network/client/index.ts'),
        '@plugin/client-settings': resolve('../../plugins/client-settings/client/index.ts'),
        '@plugin/client-person': resolve('../../plugins/client-person/client/index.ts'),
      },
    },
  },
})
