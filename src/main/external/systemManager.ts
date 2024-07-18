import { systemPreferences, SystemPreferences } from 'electron'

import { Context, Service } from '@main'

declare module '@main' {
  interface Context {
    system: SystemManager
  }
}

export namespace SystemManager {
  export interface Config {}
}

export class SystemManager extends Service {
  system: SystemPreferences

  constructor(ctx: Context, public config: SystemManager.Config) {
    super(ctx, 'system')
    this.system = systemPreferences
  }

  getAccentColor() {
    return this.system.getAccentColor()
  }
}
