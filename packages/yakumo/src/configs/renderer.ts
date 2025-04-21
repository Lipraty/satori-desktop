import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default (root: string, external: string[]) => defineConfig({
  root,
  plugins: [vue()],
  build: {
    minify: true,
    emptyOutDir: false,
    outDir: resolve(root, 'lib'),
    commonjsOptions: {
      strictRequires: true,
    },
    lib: {
      entry: resolve(root, 'src/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external
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
