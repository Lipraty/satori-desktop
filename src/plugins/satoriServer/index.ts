import { Context } from "cordis"
import { } from '@satorijs/adapter-satori'
import { } from '@internal/ipc'
import { } from '@internal/database'
import { SatoriAppContact, Contact } from "./contact"
import { Event, SessionFunction } from './types'
import { IpcEventKeys } from "@shared/ipc"

declare module '@shared/ipc' {
  interface IpcEvents {
    'session:contact-updated': (event: Event, contact: Contact) => void
    'session:login-added': SessionFunction
    'session:login-removed': SessionFunction
    'session:login-updated': SessionFunction
    'session:message-created': SessionFunction
    'session:message-deleted': SessionFunction
    'session:message-updated': SessionFunction
    'session:message-pinned': SessionFunction
    'session:message-unpinned': SessionFunction
    'session:guild-added': SessionFunction
    'session:guild-removed': SessionFunction
    'session:guild-updated': SessionFunction
    'session:guild-member-added': SessionFunction
    'session:guild-member-removed': SessionFunction
    'session:guild-member-updated': SessionFunction
    'session:guild-role-created': SessionFunction
    'session:guild-role-deleted': SessionFunction
    'session:guild-role-updated': SessionFunction
    'session:reaction-added': SessionFunction
    'session:reaction-removed': SessionFunction
    'session:friend-request': SessionFunction
    'session:guild-request': SessionFunction
    'session:guild-member-request': SessionFunction
    'session:before-send': SessionFunction
    'session:send': SessionFunction
  }
}

export const name = 'satori-server'

export const inject = ['satori', 'ipc', 'snowflake']

export async function apply(ctx: Context) {
  const contact = new SatoriAppContact(ctx.model)

  ctx.on('internal/session', async ({ type, event }) => {
    if (type === 'internal') return
    ctx.ipc.sendAll(`session:${type}` as IpcEventKeys, event)
    if (type === 'message-created') {
      const newContact = await contact.updateContact(event)
      ctx.ipc.sendAll('session:contact-updated', event, newContact)
    }
  })
}
