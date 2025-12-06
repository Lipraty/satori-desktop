import type { Context } from 'yakumo'

export const inject = ['yakumo']

export function apply(ctx: Context) {
  ctx.register('build', async () => {

  })
}
