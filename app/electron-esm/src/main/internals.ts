import type { Plugin } from 'cordis'
import HTTP from '@cordisjs/plugin-http'
import HTTPPkg from '@cordisjs/plugin-http/package.json' with { type: 'json' }
import Server from '@cordisjs/plugin-server'
import ServerPkg from '@cordisjs/plugin-server/package.json' with { type: 'json' }
import AppServer from '@satoriapp/plugin-app-server'
import AppServerPkg from '@satoriapp/plugin-app-server/package.json' with { type: 'json' }
import ClientMessages from '@satoriapp/plugin-client-messages'
import ClientMessagesPkg from '@satoriapp/plugin-client-messages/package.json' with { type: 'json' }
import ClientNetwork from '@satoriapp/plugin-client-network'
import ClientNetworkPkg from '@satoriapp/plugin-client-network/package.json' with { type: 'json' }
import ClientSettings from '@satoriapp/plugin-client-settings'
import ClientSettingsPkg from '@satoriapp/plugin-client-settings/package.json' with { type: 'json' }
import Link from '@satoriapp/plugin-link-ipc'
import LinkPkg from '@satoriapp/plugin-link-ipc/package.json' with { type: 'json' }
import Message from '@satoriapp/plugin-message'

import MessagePkg from '@satoriapp/plugin-message/package.json' with { type: 'json' }
import * as MsgDb from '@satoriapp/plugin-msgdb'
import MsgDbPkg from '@satoriapp/plugin-msgdb/package.json' with { type: 'json' }
import * as ResourceStore from '@satoriapp/plugin-resource-store'
import ResourceStorePkg from '@satoriapp/plugin-resource-store/package.json' with { type: 'json' }
import State from '@satoriapp/plugin-state'
import StatePkg from '@satoriapp/plugin-state/package.json' with { type: 'json' }
import Satori from '@satorijs/core'

import SatoriPkg from '@satorijs/core/package.json' with { type: 'json' }

import SQLite from '@minatojs/driver-sqlite'
import SQLitePkg from '@minatojs/driver-sqlite/package.json' with { type: 'json' }

export interface PluginCordisService {
  required?: string[]
  implements?: string[]
  optional?: string[]
}

export interface PluginMeta {
  service?: PluginCordisService
  node?: boolean
  [key: string]: unknown
}

export interface RuntimePluginManifest {
  name: string
  packageName: string
  meta: PluginMeta
  version: string
  internal?: boolean
  plugin: Plugin<any, any>
}

export const plugins: RuntimePluginManifest[] = [
  {
    name: 'sqlite',
    packageName: '@minatojs/driver-sqlite',
    meta: {},
    version: SQLitePkg.version,
    internal: true,
    plugin: SQLite,
  },
  {
    name: 'satori',
    packageName: '@satorijs/core',
    meta: SatoriPkg.cordis || {},
    version: SatoriPkg.version,
    internal: true,
    plugin: Satori,
  },
  {
    name: 'http',
    packageName: '@cordisjs/plugin-http',
    meta: {},
    version: HTTPPkg.version,
    internal: true,
    plugin: HTTP,
  },
  {
    name: 'server',
    packageName: '@cordisjs/plugin-server',
    meta: {},
    version: ServerPkg.version,
    internal: true,
    plugin: Server,
  },
  {
    name: 'link',
    packageName: '@satoriapp/plugin-link',
    meta: {},
    version: LinkPkg.version,
    internal: true,
    plugin: Link,
  },
  {
    name: 'app-server',
    packageName: '@satoriapp/plugin-app-server',
    meta: {},
    version: AppServerPkg.version,
    internal: true,
    plugin: AppServer,
  },
  {
    name: 'state',
    packageName: '@satoriapp/plugin-state',
    meta: {},
    version: StatePkg.version,
    internal: true,
    plugin: State,
  },
  {
    name: 'msgdb',
    packageName: '@satoriapp/plugin-msgdb',
    meta: {},
    version: MsgDbPkg.version,
    internal: true,
    plugin: MsgDb,
  },
  {
    name: 'resource-store',
    packageName: '@satoriapp/plugin-resource-store',
    meta: {},
    version: ResourceStorePkg.version,
    internal: true,
    plugin: ResourceStore,
  },
  {
    name: 'message',
    packageName: '@satoriapp/plugin-message',
    meta: {},
    version: MessagePkg.version,
    internal: true,
    plugin: Message,
  },
  {
    name: 'client-messages',
    packageName: '@satoriapp/plugin-client-messages',
    meta: {},
    version: ClientMessagesPkg.version,
    internal: true,
    plugin: ClientMessages,
  },
  {
    name: 'client-network',
    packageName: '@satoriapp/plugin-client-network',
    meta: {},
    version: ClientNetworkPkg.version,
    internal: true,
    plugin: ClientNetwork,
  },
  {
    name: 'client-settings',
    packageName: '@satoriapp/plugin-client-settings',
    meta: {},
    version: ClientSettingsPkg.version,
    internal: true,
    plugin: ClientSettings,
  },
]
