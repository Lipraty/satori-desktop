import type {
  AppChannel,
  AppGuild,
  AppGuildMember,
  AppGuildRole,
  AppLogin,
  AppUser,
} from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import type {} from 'minato'

export const name = 'resource-store'
export const inject = ['model']

declare module 'minato' {
  interface Tables {
    user: AppUser
    guild: AppGuild
    channel: AppChannel
    guild_member: AppGuildMember
    guild_role: AppGuildRole
    login: AppLogin
  }
}

export function apply(ctx: Context) {
  ctx.model.extend('user', {
    uid: 'bigint(64)',
    id: 'string',
    name: 'string',
    nick: 'string',
    userId: 'string',
    username: 'string',
    nickname: 'string',
    avatar: 'string',
    discriminator: 'string',
    isBot: 'boolean',
    updatedAt: 'integer(32)',
  }, {
    autoInc: true,
    primary: 'uid',
  })

  ctx.model.extend('guild', {
    uid: 'bigint(64)',
    id: 'string',
    name: 'string',
    avatar: 'string',
    updatedAt: 'integer(32)',
  }, {
    autoInc: true,
    primary: 'uid',
  })

  ctx.model.extend('channel', {
    uid: 'bigint(64)',
    id: 'string',
    guildId: 'string',
    type: 'unsigned(2)',
    name: 'string',
    parentId: 'string',
    position: 'integer(32)',
    updatedAt: 'integer(32)',
  }, {
    autoInc: true,
    primary: 'uid',
  })

  ctx.model.extend('guild_member', {
    uid: 'bigint(64)',
    guildId: 'string',
    userId: 'string',
    user: 'json',
    name: 'string',
    nick: 'string',
    avatar: 'string',
    title: 'string',
    roles: 'json',
    joinedAt: 'integer(32)',
    updatedAt: 'integer(32)',
  }, {
    autoInc: true,
    primary: 'uid',
  })

  ctx.model.extend('guild_role', {
    uid: 'bigint(64)',
    guildId: 'string',
    id: 'string',
    name: 'string',
    color: 'integer(32)',
    position: 'integer(32)',
    permissions: 'bigint(64)',
    hoist: 'boolean',
    mentionable: 'boolean',
    updatedAt: 'integer(32)',
  }, {
    autoInc: true,
    primary: 'uid',
  })

  ctx.model.extend('login', {
    uid: 'bigint(64)',
    platform: 'string',
    selfId: 'string',
    adapter: 'string',
    status: 'unsigned(3)',
    hidden: 'boolean',
    features: 'json',
    updatedAt: 'integer(32)',
  }, {
    autoInc: true,
    primary: 'uid',
  })
}
