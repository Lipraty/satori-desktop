import { Context } from 'yakumo'
import { bundlePlugins } from './plugins'
import { bundlePackages } from './packages'

export const inject = ['yakumo']

export function apply(ctx: Context) {
  ctx.register('bundle', async () => {
    await bundlePlugins(ctx)
    await bundlePackages(ctx)
  })
}
