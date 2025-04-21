import { resolve } from "node:path";
import { defineConfig } from "vite";

export default (root: string, external: string[]) => defineConfig({
  root,
  build: {
    outDir: resolve(root, 'lib'),
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: resolve(root, 'src/index.ts'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external,
    },
  },
  resolve: {
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
})
