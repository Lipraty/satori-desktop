import { Context } from 'yakumo'
import * as vite from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

export const inject = ['yakumo']

export function apply(ctx: Context) {
  ctx.register('start', async () => {
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
      manifest[meta.name] = meta['sapp'] || {}

      let config: vite.UserConfig = {}
      if (existsSync(resolve(root, 'client')) && deps['@satoriapp/client']) {
        config = {
          plugins: [vue()]
        }
      }

      try {
        await build(root, config)
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
        config = {
          plugins: [vue()],
          build: {
            rollupOptions: {
              output: {
                format: 'cjs',
                inlineDynamicImports: true,
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
              }
            }
          }
        }
      }

      try {
        await build(root, config)
      } catch (error) {
        ctx.logger('PackageBuilder').error('build ', meta.name, ' failed %s', error)
        continue
      }
    }
  })
}

export async function build(root: string, config: vite.UserConfig) {
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
          'electron'
        ]
      }
    }
  }, config))
}
