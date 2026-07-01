import type { EntryOptions } from '@cordisjs/plugin-loader'
import type { PluginManifest } from '@satoriapp/electron-loader'
import AppServer from '@satoriapp/plugin-app-server'
import ClientMessages from '@satoriapp/plugin-client-messages'
import ConversationSync from '@satoriapp/plugin-conversation-sync'
import Link from '@satoriapp/plugin-link-ipc'
import Message from '@satoriapp/plugin-message'
import * as MsgDb from '@satoriapp/plugin-msgdb'
import * as ResourceStore from '@satoriapp/plugin-resource-store'
import State from '@satoriapp/plugin-state'
import Database from '@cordisjs/plugin-database'
import DatabaseSqlite from '@cordisjs/plugin-database-sqlite'
import HTTP from '@cordisjs/plugin-http'
import Logger from '@cordisjs/plugin-logger'
import Server from '@cordisjs/plugin-server'
import WindowService from './window'

export const plugins: PluginManifest[] = [
  { name: 'logger', plugin: Logger },
  { name: 'database', plugin: Database },
  { name: 'database-sqlite', plugin: DatabaseSqlite },
  { name: 'http', plugin: HTTP },
  { name: 'server', plugin: Server },
  { name: 'link', plugin: Link },
  { name: 'app-server', plugin: AppServer },
  { name: 'state', plugin: State },
  { name: 'msgdb', plugin: MsgDb },
  { name: 'resource-store', plugin: ResourceStore },
  { name: 'message', plugin: Message },
  { name: 'conversation-sync', plugin: ConversationSync },
  { name: 'client-messages', plugin: ClientMessages },
  { name: 'window', plugin: WindowService },
]

export function buildDefaultEntries(manifests: PluginManifest[], dbPath: string): EntryOptions[] {
  return manifests.map((m) => {
    const entry: EntryOptions = {
      id: `builtin-${m.name}`,
      name: `cordis:${m.name}`,
    }
    if (m.name === 'database-sqlite')
      entry.config = { path: dbPath }
    if (m.name === 'server')
      entry.config = { host: '127.0.0.1', port: 5140 }
    if (m.name === 'window')
      entry.config = { theme: 'system', width: 1076, height: 653 }
    return entry
  })
}
