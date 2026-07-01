import type { Context } from 'yakumo'

import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

import yaml from '@rollup/plugin-yaml'
import vue from '@vitejs/plugin-vue'
import * as vite from 'vite'

import { externals, OUT_DIR } from './utils'

export async function bundleClients(ctx: Context) {
  const paths = ctx.yakumo.locate(ctx.yakumo.argv._).filter(path => path.startsWith('/plugins'))

  for (const path of paths) {
    const root = ctx.yakumo.cwd + path
    const meta = ctx.yakumo.workspaces[path]
    const clientEntry = resolve(root, 'client/index.ts')

    try {
      await access(clientEntry)
    }
    catch {
      continue
    }

    const external = externals([
      ...Object.keys(meta?.dependencies || {}),
      ...Object.keys(meta?.peerDependencies || {}),
    ])

    try {
      await vite.build(vite.defineConfig({
        root,
        plugins: [
          yaml(),
          vue({
            template: {
              compilerOptions: {
                isCustomElement: tag => tag.includes('fluent-'),
              },
            },
          }),
        ],
        build: {
          outDir: resolve(root, OUT_DIR, 'client'),
          emptyOutDir: true,
          minify: false,
          lib: {
            entry: clientEntry,
            fileName: '[name]',
            formats: ['es'],
          },
          rollupOptions: {
            external,
            output: {
              preserveModules: true,
              preserveModulesRoot: 'client',
            },
          },
          cssCodeSplit: true,
        },
        resolve: {
          extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
          alias: {
            [meta.name]: clientEntry,
          },
        },
      }))
    }
    catch (error) {
      ctx.logger('builder').error('build client %s failed %c', meta.name, error)
      continue
    }
  }

  ctx.logger('builder').info('bundle clients success')
}
