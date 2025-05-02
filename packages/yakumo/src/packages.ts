import { resolve } from 'node:path'

import * as vite from 'vite'

import { Context } from 'yakumo'

import { BundleConfig, ENTRY, externals, OUT_DIR } from './utils'
import MainConfig from './configs/main'
import RendererConfig from './configs/renderer'
import LoaderConfig from './configs/loader'


export const configMapping: Record<string, BundleConfig> = {
  '@satoriapp/main': MainConfig,
  '@satoriapp/renderer': RendererConfig,
  '@satoriapp/loader': LoaderConfig,
}

export const bundlePackages = async (ctx: Context) => {
  const paths = ctx.yakumo.locate(ctx.yakumo.argv._).filter(path => path.startsWith('/packages'))

  for (const path of paths) {
    const root = ctx.yakumo.cwd + path
    const meta = ctx.yakumo.workspaces[path]
    const external = externals([
      ...Object.keys(meta?.dependencies || {}),
      ...Object.keys(meta?.peerDependencies || {}),
    ])
    const configer = configMapping[meta.name]
    const config = configer?.config || configer?.priprocess?.(root, external) || vite.defineConfig({})

    try {
      await vite.build(vite.mergeConfig(vite.defineConfig({
        root,
        build: {
          outDir: resolve(root, OUT_DIR),
          emptyOutDir: true,
          minify: false,
          lib: {
            entry: resolve(root, ENTRY),
            fileName: '[name]',
            formats: ['es', 'cjs'],
          },
          rollupOptions: {
            external,
          },
        },
        resolve: {
          alias: {
            // Prevent vite from parsing main/module/exports of package.json incorrectly.
            [meta.name]: resolve(root, ENTRY),
          }
        }
      }), config))
    } catch (error) {
      ctx.logger('builder').error('build %s failed %c', meta.name, error)
      continue
    }
  }
}
