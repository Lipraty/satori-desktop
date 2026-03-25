import type { Context } from 'yakumo'

import { bundleClients } from './clients'
import { bundlePackages } from './packages'
import { bundlePlugins } from './plugins'

export const inject = ['yakumo']

export function apply(ctx: Context) {
  ctx.register('bundle', async () => {
    ctx.logger.info('Bundling packages')
    await bundlePackages(ctx)
  })

  ctx.register('plugins', async () => {
    ctx.logger.info('Bundling plugins')
    await bundlePlugins(ctx)
  })

  ctx.register('client', async () => {
    ctx.logger.info('Bundling client plugins')
    await bundleClients(ctx)
  })
}
