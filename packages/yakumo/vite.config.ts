import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'
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
        'tty',
        'vite',
        '@vitejs/plugin-vue',
        'vue',
        'yakumo',
        ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
      ]
    }
  }
})