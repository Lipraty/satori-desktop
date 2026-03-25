import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('../../', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@satoriapp/link': resolve(root, 'packages/link/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json'],
      include: ['src/**'],
    },
  },
})
