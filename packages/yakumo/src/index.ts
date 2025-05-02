import { Context } from 'yakumo'

import { bundlePlugins } from './plugins'
import { bundlePackages } from './packages'

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
}
