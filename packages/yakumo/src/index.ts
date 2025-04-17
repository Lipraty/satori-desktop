import { Context, PackageJson } from 'yakumo'
import * as vite from 'vite'
import { writeFile } from 'node:fs/promises'
import { builtinModules } from 'node:module'

import MainConfig from './configs/main'
import PreloadConfig from './configs/preload'
import RendererConfig from './configs/renderer'
import LoaderConfig from './configs/loader'
import DefaultConfig from './configs/default'

export const inject = ['yakumo']

export const builtins = ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()];

export function apply(ctx: Context) {
  const builder = async (path: string, configer: (root: string, external?: string[]) => vite.UserConfig) => {
    const meta = ctx.yakumo.workspaces[path]
    const root = ctx.yakumo.cwd + path
    return await vite.build(configer(root, [
      ...builtins,
      ...Object.keys(meta?.dependencies || {})
    ]))
  }

  ctx.register('bundle', async () => {
    const paths = ctx.yakumo.locate(ctx.yakumo.argv._)
    const packages = paths.filter(path => path.startsWith('/packages'))
    const plugins = paths.filter(path => path.startsWith('/plugins'))

    // step 1: build plugins and generate manifest.json
    let manifest: Record<string, any> = {}
    for (const path of plugins) {
      const meta = ctx.yakumo.workspaces[path]
      const deps = {
        ...meta.dependencies,
        ...meta.devDependencies,
        ...meta.peerDependencies,
        ...meta.optionalDependencies,
      }
      manifest[meta.name] = {
        path,
        meta: meta['sapp'] || {},
        deps
      }

      try {
        const result = await builder(path, DefaultConfig)
      } catch (error) {
        ctx.logger('builder').error('build ', meta.name, ' failed %c', error)
        continue
      }
    }

    await writeFile(ctx.yakumo.cwd + '/packages/loader/src/plugins.manifest.json', JSON.stringify(manifest, null, 2))

    // step 2: build app packages
    for (const path of packages) {
      const meta = ctx.yakumo.workspaces[path]

      let config: (root: string, external: string[]) => vite.UserConfig
      
      if (meta.name === '@satoriapp/renderer') {
        config = RendererConfig
      } else if (meta.name === '@satoriapp/preload') {
        config = PreloadConfig
      } else if (meta.name === '@satoriapp/main') {
        config = MainConfig
      } else if (meta.name === '@satoriapp/loader') {
        config = LoaderConfig
      } else {
        config = DefaultConfig
      }

      try {
        const result = await builder(path, config)
      } catch (error) {
        ctx.logger('builder').error('build ', meta.name, ' failed %c', error)
        continue
      }
    }
  })

  ctx.register('start', async () => {
    
  })
}
