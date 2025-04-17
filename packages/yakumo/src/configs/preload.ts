import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default (root: string, external: string[]) => defineConfig({
  root,
  build: {
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(root, 'src/index.ts'),
      external,
      output: {
        format: 'cjs',
        inlineDynamicImports: true,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
