import { Database } from '@internal/database'
import { Event } from '@shared/protocol'

declare module '@internal/database' {
  interface Tables {
    contact: Contact
  }
}

export interface Contact {}

export class SatoriAppContact {
  private _contactCache: Map<string, Contact> = new Map()

  constructor(model: Database) {
    model.extend('contact', {})
  }

  async updateContact(event: Event): Promise<Contact> {
    return {}
  }
}
