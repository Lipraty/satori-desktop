import type { BundleConfig } from '../utils'

import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

import { defineConfig } from 'vite'
import { injectCssImports } from '../plugins/injectCssImports'

export default {
  priprocess: (root: string, external: string[]) => defineConfig({
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: tag => tag.includes('fluent-'),
          },
        },
      }),
      injectCssImports(),
    ],
    build: {
      minify: false,
      commonjsOptions: {
        strictRequires: true,
      },
      lib: {
        entry: resolve(root, 'src/index.ts'),
        fileName: '[name]',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external,
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
          assetFileNames: (assetInfo) => {
            return assetInfo.name || '[name]-[hash].[ext]'
          },
        },
      },
      cssCodeSplit: true,
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    css: {
      modules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCaseOnly',
      },
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
        sass: {
          api: 'modern-compiler',
        },
      },
      devSourcemap: true,
    },
    clearScreen: true,
  }),
} as BundleConfig
