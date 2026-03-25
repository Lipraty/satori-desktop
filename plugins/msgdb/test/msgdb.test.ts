import { Context } from 'cordis'
import Database from 'minato'
import { describe, expect, it } from 'vitest'
import { apply } from '../src/index'

describe('plugin-msgdb schema registration', () => {
  it('registers message table schema when model service is available', () => {
    const ctx = new Context()
    // Provide a minimal model/database service by instantiating Database directly
    const db = new Database(ctx)
    ;(ctx as any).model = db
    ;(ctx as any).database = db

    // Apply the plugin directly (simulates plugin load after model service is ready)
    apply(ctx)

    const tables = db.tables
    expect(tables).toHaveProperty('message')

    const model = tables.message
    expect(model).toBeDefined()
    expect(model.primary).toContain('uid')
    expect(model.autoInc).toBe(true)
  })

  it('message table has expected fields', () => {
    const ctx = new Context()
    const db = new Database(ctx)
    ;(ctx as any).model = db
    ;(ctx as any).database = db

    apply(ctx)

    const fields = db.tables.message.fields
    const fieldNames = Object.keys(fields)

    expect(fieldNames).toContain('uid')
    expect(fieldNames).toContain('seq')
    expect(fieldNames).toContain('platform')
    expect(fieldNames).toContain('channelId')
    expect(fieldNames).toContain('syncFlag')
    expect(fieldNames).toContain('dead')
    expect(fieldNames).toContain('localOnly')
    expect(fieldNames).toContain('isEvent')
    expect(fieldNames).toContain('content')
    expect(fieldNames).toContain('timestamp')
    expect(fieldNames).toContain('createdAt')
    expect(fieldNames).toContain('updatedAt')
  })
})
