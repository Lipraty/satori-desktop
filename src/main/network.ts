import { SatoriAdapter as AdapterSatori } from "@satorijs/adapter-satori"
import { DiscordBot as AdapterDiscord } from '@satorijs/adapter-discord'

import { Context, Service } from "./context"

// NOTE
// To eliminate ambiguity in the code
// in the main process we will use
// the term "adapter" to refer to the
// network adapter service.

declare module './context' {
  interface Context {
    adapter: SatoriAdapterService
  }

  // NOTE
  // in renderer process, we will use
  // the term "network".
  interface Events {
    'network/ready': void
  }
}

export const appNetworks = {
  satori: {
    name: 'Satori',
    adapter: AdapterSatori,
    config: AdapterSatori.Config,
  },
  discord: {
    name: 'Discord',
    adapter: AdapterDiscord,
    config: AdapterDiscord.Config,
  },
}

export type AppNetwork = keyof typeof appNetworks

export const appNetworksList = Object.keys(appNetworks) as AppNetwork[]

/**
 * The network adapter service.
 * 
 * This service is responsible for managing the network adapters.
 */
export default class SatoriAdapterService extends Service {
  static inject = ['ipc']

  constructor(ctx: Context) {
    super(ctx, 'adapter')
  }
}
