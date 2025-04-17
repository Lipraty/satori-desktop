import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default (root: string, external: string[]) => {
  const input = readdirSync(resolve(root, 'src')).map(file => resolve(root, 'src', file))
  return defineConfig({
    root,
    build: {
      outDir: resolve(root, 'lib'),
      emptyOutDir: true,
      minify: false,
      lib: {
        entry: resolve(root, 'src/index.ts'),
        fileName: () => '[name].js',
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
}
