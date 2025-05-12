import Satori from '@satorijs/core'
import HTTP from '@cordisjs/plugin-http'
import Server from '@cordisjs/plugin-server'
import SatoriApp from '@satoriapp/app'

import SatoriPkg from '@satorijs/core/package.json' with { type: 'json' }
import HTTPPkg from '@cordisjs/plugin-http/package.json' with { type: 'json' }
import ServerPkg from '@cordisjs/plugin-server/package.json' with { type: 'json' }
import SatoriAppPkg from '@satoriapp/app/package.json' with { type: 'json' }

import { PluginManifest } from '@satoriapp/loader'

export const plugins: PluginManifest[] = [
  {
    name: 'satori',
    packageName: '@satorijs/core',
    meta: SatoriPkg.cordis || {},
    version: SatoriPkg.version,
    internal: true,
    plugin: Satori
  },
  {
    name: 'http',
    packageName: '@cordisjs/plugin-http',
    meta: {},
    version: HTTPPkg.version,
    internal: true,
    plugin: HTTP
  },
  {
    name: 'server',
    packageName: '@cordisjs/plugin-server',
    meta: {},
    version: ServerPkg.version,
    internal: true,
    plugin: Server
  },
  {
    name: 'sapp',
    packageName: '@satoriapp/app',
    meta: {},
    version: SatoriAppPkg.version,
    internal: true,
    plugin: SatoriApp
  }
]

