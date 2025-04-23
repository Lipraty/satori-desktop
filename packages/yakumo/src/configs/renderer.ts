import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { BundleConfig } from '../utils'
import { resolve } from 'node:path'

export default {
  priprocess: (root: string, external: string[]) => defineConfig({
    plugins: [vue()],
    build: {
      minify: false,
      commonjsOptions: {
        strictRequires: true,
      },
      lib: {
        entry: resolve(root, 'src/index.ts'),
        fileName: () => '[name].js',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name].[ext]',
          exports: 'named',
        }
      }
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
