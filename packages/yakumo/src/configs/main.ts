import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import { BundleConfig } from "../utils";

export default {
  priprocess: (root: string, external: string[]) => {
    const input = readdirSync(resolve(root, 'src'))
      .filter(file => file.endsWith('.ts') && file !== 'index.ts')
      .map(file => resolve(root, 'src', file))
    return defineConfig({
      build: {
        lib: {
          entry: resolve(root, 'src/index.ts'),
          fileName: '[name]',
          formats: ['es', 'cjs'],
        },
        rollupOptions: {
          input: [
            resolve(root, 'src/index.ts'),
            ...input,
          ],
          external,
          output: {
            exports: 'named',
          }
        },
      },
      resolve: {
        mainFields: ['module', 'jsnext:main', 'jsnext'],
      },
    })
  }
} as BundleConfig
