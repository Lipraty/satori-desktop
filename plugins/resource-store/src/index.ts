import type {
  AppChannel,
  AppGuild,
  AppGuildMember,
  AppGuildRole,
  AppLogin,
  AppUser,
} from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import type {} from 'minato' // module augmentation

export const name = 'resource-store'
export const inject = ['database']

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

const RESOURCE_TABLES = ['user', 'guild', 'channel', 'guild_member', 'guild_role', 'login'] as const

function tableFieldName(name: string): string {
  return name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value)
    return []
  return Array.isArray(value) ? value : [value]
}

function patchResourceDefaults(name: string, item: Record<string, unknown>, session: Record<string, unknown>, platform: string): Record<string, unknown> {
  const now = Date.now()
  const record: Record<string, unknown> = {
    ...item,
    updatedAt: item.updatedAt || now,
  }

  if (platform && !record.platform && name === 'login') {
    record.platform = platform
  }

  if (name === 'guild_member') {
    record.guildId = record.guildId || session.guildId || ''
    const user = record.user as { id?: string } | undefined
    record.userId = record.userId || user?.id || session.userId || ''
  }

  if (name === 'channel') {
    record.guildId = record.guildId || session.guildId || ''
  }

  return record
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

  ctx.on('internal/session', async (session: any) => {
    const platform = (session.platform || '').toString()
    let projected = 0

    for (const name of RESOURCE_TABLES) {
      const payload = session[tableFieldName(name)]
      const rows = toArray(payload as Record<string, unknown> | Record<string, unknown>[] | undefined)
      if (!rows.length)
        continue

      const records = rows.map(item => patchResourceDefaults(name, item, session, platform))
      try {
        await ctx.database.upsert(name, records)
        projected += records.length
      }
      catch (error) {
        ctx.logger('resource-store').warn('project-resource:%s failed: %s', name, error instanceof Error ? error.message : String(error))
      }
    }

    if (projected) {
      ctx.emit('message/resource-projected', 'session', projected)
    }
  })
}
