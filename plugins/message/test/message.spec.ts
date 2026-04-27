import { Context } from 'cordis'
import { describe, expect, it } from 'vitest'
import AppMessageService from '../src/index'

function createTestService() {
  const ctx = new Context()
  ctx.plugin(AppMessageService as any)
  const service = (ctx as any).message as AppMessageService
  return { service, ctx }
}

describe('plugin-message span runtime', () => {
  it('assigns isolated syncFlag for first message', async () => {
    const { service } = createTestService()
    const message = await service.create({
      platform: 'test',
      channelId: 'c1',
      content: 'hello',
      timestamp: 1000,
      localOnly: true,
    })

    expect(message.syncFlag).toBe(3)
    expect(Number(message.seq & 0xFFFn)).toBe(2048)

    const spans = service.listSpans('test', 'c1')
    expect(spans).toHaveLength(1)
    expect(spans[0].type).toBe('local')
    expect(spans[0].data).toHaveLength(1)
  })

  it('updates endpoint syncFlags and seq progression in same span', async () => {
    const { service } = createTestService()

    const first = await service.receive({
      platform: 'test',
      channelId: 'c1',
      timestamp: 2000,
      content: 'm1',
    })
    const second = await service.receive({
      platform: 'test',
      channelId: 'c1',
      timestamp: 2000,
      content: 'm2',
    })

    expect(first.seq === second.seq).toBe(false)
    expect((first.seq > second.seq ? first.seq - second.seq : second.seq - first.seq) <= 1n).toBe(true)

    const messages = service.listByChannel('test', 'c1', 10)
    expect(messages).toHaveLength(2)
    expect(new Set(messages.map(item => item.syncFlag))).toEqual(new Set([1, 2]))

    const spans = service.listSpans('test', 'c1')
    expect(spans).toHaveLength(1)
    expect(spans[0].type).toBe('sync')
  })

  it('turns span type to remote after persisted events', async () => {
    const { service } = createTestService()

    const first = await service.receive({ platform: 'test', channelId: 'c1', timestamp: 3000, content: 'a' })
    const second = await service.receive({ platform: 'test', channelId: 'c1', timestamp: 3001, content: 'b' })

    ;(service as any).markPersisted(first.seq)
    ;(service as any).markPersisted(second.seq)

    const spans = service.listSpans('test', 'c1')
    expect(spans).toHaveLength(1)
    expect(spans[0].type).toBe('remote')
  })

  it('keeps seq stable under high-volume same-timestamp messages', async () => {
    const { service } = createTestService()
    const count = 1000
    const timestamp = 4000

    for (let index = 0; index < count; index++) {
      await service.receive({
        platform: 'test',
        channelId: 'c1',
        timestamp,
        content: `bulk-${index}`,
      })
    }

    const messages = service.listByChannel('test', 'c1', count + 10)
    expect(messages).toHaveLength(count)

    const seqs = messages.map(item => item.seq)
    const uniqueSeqs = new Set(seqs.map(item => item.toString()))
    expect(uniqueSeqs.size).toBe(count)

    for (const seq of seqs) {
      const sequencePart = Number(seq & 0xFFFn)
      expect(sequencePart).toBeGreaterThanOrEqual(0)
      expect(sequencePart).toBeLessThanOrEqual(4095)
    }
  })

  it('deleteMessage marks message as dead', async () => {
    const { service } = createTestService()
    const message = await service.receive({
      platform: 'test',
      channelId: 'c1',
      timestamp: 5000,
      content: 'to-delete',
    })

    expect(message.dead).toBe(false)
    const result = service.deleteMessage(message.seq)
    expect(result).toBe(true)

    const messages = service.listByChannel('test', 'c1', 10)
    expect(messages[0].dead).toBe(true)
  })
})
