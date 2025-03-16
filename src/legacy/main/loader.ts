/**
 * TODO
 * 
 * 1. Load the app
 * 2. Start the app database
 * 3. Read the settings
 * 4. Start the app external server
 * 5. ~~Create the app window~~ (better of windowManager service)
 * 6. Load the plugins
 * 
 * HMR?
 */

import { Context } from '@main'
import { readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Plugin } from 'cordis'
import Schema from 'schemastery'

import { Settings } from './settings'

//base plguins
import { HTTP as CordisHTTP } from '@cordisjs/plugin-http'
import { SQLiteDriver as Driver } from '@minatojs/driver-sqlite'
import { Satori } from '@satorijs/core'

const scriptExtension = ['.js', '.ts', '.mjs', '.cjs']
const priority = ['database']

export const inject = ['settings']

export async function apply(ctx: Context) {
  ctx.settings.readSettings()

  

  const configs: Settings = ctx.settings.settings
  const plugins: Plugin[] = [
    ...(await loadBasePlugins()),
    ...(await loadExternalPlugins(ctx.config.externalsDir))
  ].sort((a, b) => {
    return priority.indexOf(a.name!) - priority.indexOf(b.name!)
  })

  for (const plugin of plugins) {
    configs[plugin.name!] = plugin.Config
    ctx.plugin(plugin, configs[plugin.name!])
  }
}

async function loadBasePlugins() {
  return [
    CordisHTTP,
    Driver,
    Satori
  ]
}

// async function loadExternalServices(externalsDir: string) {
//   const plugins: Plugin[] = []
//   const _externals = await readdir(externalsDir)

//   for (const external of _externals) {
//     const externalPath = resolve(externalsDir, external)
//     const externalStat = await stat(externalPath)

//     if (externalStat.isFile() && scriptExtension.includes(externalPath.split('.').pop()!)) {
//       const plguin = await import(externalPath) as Plugin
//       plugins.push(plguin)
//     }

//     if (externalStat.isDirectory()) {
//       const externalWithDir = await readdir(externalPath)
//       const externalIndexScriptPath = externalWithDir.find((file) => {
//         if (file.startsWith('index') && scriptExtension.includes(file.split('.').pop()!)) {
//           return file
//         }
//         return false
//       })
//       if (externalIndexScriptPath) {
//         const plguin = await import(resolve(externalPath, externalIndexScriptPath)) as Plugin
//         plugins.push(plguin)
//       } else {
//         continue
//       }
//     }
//   }

//   return plugins
// }

async function loadExternalPlugins(externalsDir: string) {
  const plugins: Plugin[] = []
  const modules = import.meta.glob(externalsDir + '/**/*.{js,ts,mjs,cjs}')

  for (const path in modules) {
    const module = await modules[path]()
    plugins.push(module as Plugin)
  }

  return plugins
}

export function setupHMR(externalPath: string) {
  // TODO
}
