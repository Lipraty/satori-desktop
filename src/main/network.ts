import { SatoriAdapter as AdapterSatori } from "@satorijs/adapter-satori"
import { DiscordBot as AdapterDiscord } from '@satorijs/adapter-discord'

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
