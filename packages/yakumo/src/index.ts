import { Context, PackageJson } from 'yakumo'
import * as vite from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { builtinModules } from 'node:module'

export const inject = ['yakumo']

export const builtins = ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()];

export function apply(ctx: Context) {
  ctx.register('bundle', async () => {
    const paths = ctx.yakumo.locate(ctx.yakumo.argv._)
    const packages = paths.filter(path => path.startsWith('/packages'))
    const plugins = paths.filter(path => path.startsWith('/plugins'))

    // step 1: build plugins and generate manifest.json
    let manifest: Record<string, any> = {}
    for (const path of plugins) {
      const meta = ctx.yakumo.workspaces[path]
      const root = ctx.yakumo.cwd + path
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

      let config: vite.UserConfig = {}
      if (existsSync(resolve(root, 'client')) && deps['@satoriapp/client']) {
        config = {
          plugins: [vue()]
        }
      }

      try {
        await build(root, config, deps)
      } catch (error) {
        ctx.logger('PluginBuilder').error('build ', meta.name, ' failed %s', error)
        continue
      }
    }

    await writeFile(ctx.yakumo.cwd + '/packages/loader/src/plugins.manifest.json', JSON.stringify(manifest, null, 2))

    // step 2: build app packages
    for (const path of packages) {
      const meta = ctx.yakumo.workspaces[path]
      const root = ctx.yakumo.cwd + path
      const deps = {
        ...meta.dependencies,
        ...meta.devDependencies,
        ...meta.peerDependencies,
        ...meta.optionalDependencies,
      }

      let config: vite.UserConfig = {}

      if (meta.name === '@satoriapp/renderer') {
        console.log('build renderer')
        config = {
          plugins: [vue()],
          build: {
            minify: true,
            emptyOutDir: true,
            commonjsOptions: {
              strictRequires: true,
            },
            rollupOptions: {
              makeAbsoluteExternalsRelative: true,
              external: [
                ...builtins,
                ...Object.keys(deps),
              ],
              output: {
                format: 'iife',
              }
            }
          },
          css: {
            preprocessorOptions: {
              scss: {
                api: 'modern-compiler',
              },
            },
          },
        }
      }

      try {
        await build(root, config, deps)
      } catch (error) {
        ctx.logger('PackageBuilder').error('build ', meta.name, ' failed %s', error)
        continue
      }
    }
  })
}

export async function build(root: string, config: vite.UserConfig, deps: { [x: string]: string; }) {
  return await vite.build(vite.mergeConfig({
    root,
    build: {
      lib: {
        entry: resolve(root, 'src/index.ts'),
        fileName: 'index',
        formats: ['cjs', 'es']
      },
      outDir: resolve(root, 'lib'),
      emptyOutDir: true,
      rollupOptions: {
        external: [
          ...builtins,
          ...Object.keys(deps)
        ]
      }
    }
  }, config))
}
