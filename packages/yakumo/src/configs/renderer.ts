import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default (root: string, external: string[]) => defineConfig({
  root,
  plugins: [vue()],
  build: {
    minify: true,
    emptyOutDir: false,
    commonjsOptions: {
      strictRequires: true,
    },
    rollupOptions: {
      makeAbsoluteExternalsRelative: true,
      external,
      input: resolve(root, 'src/index.ts'),
      output: {
        format: 'iife',
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  clearScreen: false,
})
