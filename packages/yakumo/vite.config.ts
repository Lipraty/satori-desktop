import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'satoriYakumo',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    outDir: 'lib',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'fsevents',
        'node:path',
        'path',
        'node:fs',
        'fs',
        'node:fs/promises',
        'fs/promises',
        'node:module',
        'node:crypto',
        'tty',
        'util',
        'vite',
        '@vitejs/plugin-vue',
        'vue',
        'yakumo'
      ]
    }
  }
})