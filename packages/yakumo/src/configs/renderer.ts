import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { BundleConfig } from '../utils'

export default {
  config: defineConfig({
    plugins: [vue()],
    build: {
      minify: true,
      commonjsOptions: {
        strictRequires: true,
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    clearScreen: true,
  })
} as BundleConfig
