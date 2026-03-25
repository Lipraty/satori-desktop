import type { BundleConfig } from '../utils'
import { readdirSync } from 'node:fs'

import { resolve } from 'node:path'

import { defineConfig } from 'vite'

export default {
  priprocess: (root: string, external: string[]) => {
    const input = readdirSync(resolve(root, 'src'))
      .map(file => resolve(root, 'src', file))

    return defineConfig({
      build: {
        lib: {
          entry: resolve(root, 'src/index.ts'),
          fileName: '[name]',
          formats: ['es', 'cjs'],
        },
        rollupOptions: {
          external,
          input,
        },
      },
      resolve: {
        mainFields: ['module', 'jsnext:main', 'jsnext'],
      },
    })
  },
} as BundleConfig
