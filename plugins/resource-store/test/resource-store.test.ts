import { Context } from 'cordis'
import Database from '@cordisjs/plugin-database'
import { describe, expect, it } from 'vitest'
import { apply } from '../src/index'

describe('plugin-resource-store schema registration', () => {
  function createContextWithDb() {
    const ctx = new Context()
    const db = new Database(ctx)
    ;(ctx as any).model = db
    ;(ctx as any).database = db
    return { ctx, db }
  }

  it('registers all 6 resource tables', () => {
    const { db, ctx } = createContextWithDb()
    apply(ctx)

    const tables = db.tables
    expect(tables).toHaveProperty('user')
    expect(tables).toHaveProperty('guild')
    expect(tables).toHaveProperty('channel')
    expect(tables).toHaveProperty('guild_member')
    expect(tables).toHaveProperty('guild_role')
    expect(tables).toHaveProperty('login')
  })

  it('all resource tables use uid as auto-increment primary key', () => {
    const { db, ctx } = createContextWithDb()
    apply(ctx)

    for (const tableName of ['user', 'guild', 'channel', 'guild_member', 'guild_role', 'login']) {
      const model = db.tables[tableName]
      expect(model, `${tableName} should exist`).toBeDefined()
      expect(model.primary, `${tableName}.primary`).toContain('uid')
      expect(model.autoInc, `${tableName}.autoInc`).toBe(true)
    }
  })

  it('user table has expected fields', () => {
    const { db, ctx } = createContextWithDb()
    apply(ctx)

    const fields = Object.keys(db.tables.user.fields)
    expect(fields).toContain('uid')
    expect(fields).toContain('id')
    expect(fields).toContain('name')
    expect(fields).toContain('avatar')
    expect(fields).toContain('isBot')
    expect(fields).toContain('updatedAt')
  })

  it('guild_member table has guildId and userId fields', () => {
    const { db, ctx } = createContextWithDb()
    apply(ctx)

    const fields = Object.keys(db.tables.guild_member.fields)
    expect(fields).toContain('guildId')
    expect(fields).toContain('userId')
    expect(fields).toContain('roles')
    expect(fields).toContain('joinedAt')
  })

  it('login table has platform and selfId fields', () => {
    const { db, ctx } = createContextWithDb()
    apply(ctx)

    const fields = Object.keys(db.tables.login.fields)
    expect(fields).toContain('platform')
    expect(fields).toContain('selfId')
    expect(fields).toContain('adapter')
    expect(fields).toContain('status')
    expect(fields).toContain('features')
  })
})
