import { randomUUID } from 'node:crypto'
import {} from '@satoriapp/plugin-msgdb' // module augmentation
import { Context, Service } from 'cordis'
import {} from '@cordisjs/plugin-database' // module augmentation
import {} from '@cordisjs/plugin-logger' // module augmentation

import { AppMessage, CreateMessageInput } from './types'

export type {
  AppChannel,
  AppGuild,
  AppGuildMember,
  AppGuildRole,
  AppLogin,
  AppMessage,
  AppState,
  AppStatePatch,
  AppUser,
  CreateMessageInput,
} from './types'

interface SpanRuntime {
  uid: string
  type: 'remote' | 'sync' | 'local'
  platform: string
  channelId: string
  front: bigint
  back: bigint
  data: AppMessage[]
  prev?: string
  next?: string
}

interface ChannelRuntime {
  platform: string
  channelId: string
  spans: Map<string, SpanRuntime>
  spanOrder: string[]
  messageSpan: Map<bigint, string>
  persisted: Set<bigint>
  sortedCache: AppMessage[] | null
}

interface MessageMetrics {
  ingested: number
  dedupHits: number
  persisted: number
  recovered: number
  deadMarked: number
  errors: number
}

declare module 'cordis' {
  interface Context {
    message: AppMessageService
  }

  interface Events {
    'message/created': (message: AppMessage, payload?: Record<string, unknown>) => void
    'message/dead': (seq: bigint, dead: boolean) => void
    'message/persisted': (seq: bigint) => void
    'message/recovered': (count: number) => void
    'message/degraded': (reason: string) => void
    'message/error': (stage: string, error: string) => void
  }
}

declare module '@satoriapp/link' {}

export class AppMessageService extends Service {
  static readonly name = 'message'
  static readonly inject = {
    database: { required: false },
    logger: { required: true },
  }

  private readonly channels = new Map<string, ChannelRuntime>()
  private readonly messageIdMap = new Map<string, bigint>()
  private readonly metrics: MessageMetrics = {
    ingested: 0,
    dedupHits: 0,
    persisted: 0,
    recovered: 0,
    deadMarked: 0,
    errors: 0,
  }

  private recoveredOnce = false
  private degraded = false

  constructor(ctx: Context) {
    super(ctx, 'message')
  }

  async* [Service.init]() {
    this.ctx.on('message/persisted', (seq) => {
      this.markPersisted(seq)
    })

    await this.recoverFromDatabase()
    this.ctx.logger('message').info('message service started')

    yield () => {
      this.channels.clear()
      this.messageIdMap.clear()
      this.recoveredOnce = false
      this.degraded = false
      this.ctx.logger('message').info('message service stopped')
    }
  }

  getMetrics(): MessageMetrics & { channels: number, spans: number } {
    const spans = [...this.channels.values()].reduce((acc, runtime) => acc + runtime.spans.size, 0)
    return {
      ...this.metrics,
      channels: this.channels.size,
      spans,
    }
  }

  getMessage(channelId: string, messageId: string): AppMessage | undefined {
    for (const runtime of this.channels.values()) {
      if (runtime.channelId !== channelId)
        continue
      const seq = this.messageIdMap.get(this.remoteMessageKey(runtime.platform, channelId, messageId))
      if (seq !== undefined)
        return this.findMessageBySeq(seq)
    }
    return undefined
  }

  getByRemoteId(platform: string, channelId: string, messageId: string): AppMessage | undefined {
    const seq = this.messageIdMap.get(this.remoteMessageKey(platform, channelId, messageId))
    if (seq === undefined)
      return undefined
    return this.findMessageBySeq(seq)
  }

  async recoverChannel(platform: string, channelId: string, limit = 200): Promise<number> {
    const bounded = Math.max(1, Number(limit || 200))
    const rows = await this.ctx.database.get('message', {
      platform,
      channelId,
    })

    const list = (Array.isArray(rows) ? rows as AppMessage[] : [])
      .map(item => this.asPersistedMessage(item as unknown as Record<string, unknown>))
      .sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)

    const records = list.slice(Math.max(0, list.length - bounded))
    let inserted = 0

    for (const message of records) {
      if (this.findMessageBySeq(message.seq))
        continue
      const runtime = this.ensureChannelRuntime(message.platform, message.channelId)
      const spanId = this.insertMessage(runtime, message)
      this.recomputeSpan(spanId, runtime)
      this.relinkSpans(runtime)
      runtime.persisted.add(message.seq)
      if (message.id) {
        this.messageIdMap.set(this.remoteMessageKey(message.platform, message.channelId, message.id), message.seq)
      }
      inserted++
    }

    this.metrics.recovered += inserted
    if (inserted) {
      this.ctx.emit('message/recovered', inserted)
    }
    return inserted
  }

  async create(input: CreateMessageInput): Promise<AppMessage> {
    return this.ingest({ ...input, localOnly: true })
  }

  async receive(input: CreateMessageInput): Promise<AppMessage> {
    return this.ingest({
      ...input,
      localOnly: input.localOnly ?? false,
    })
  }

  async ingest(input: CreateMessageInput): Promise<AppMessage> {
    if (input.id) {
      const existed = this.getByRemoteId(input.platform, input.channelId, input.id)
      if (existed) {
        this.metrics.dedupHits++
        return existed
      }
    }

    const runtime = this.ensureChannelRuntime(input.platform, input.channelId)
    const around = this.findNeighbor(runtime, input.timestamp)
    const prevSeq = around.left?.seq
    const nextSeq = around.right?.seq
    const timestamp = input.timestamp ?? Date.now()
    const seq = this.seqGenerator(timestamp, prevSeq, nextSeq)

    const message: AppMessage = {
      id: input.id || randomUUID(),
      seq,
      platform: input.platform,
      channelId: input.channelId,
      syncFlag: 0,
      dead: input.dead ?? false,
      localOnly: input.localOnly ?? true,
      isEvent: input.isEvent ?? false,
      eventType: input.eventType,
      eventId: input.eventId,
      content: input.content,
      createdAt: timestamp,
      timestamp,
    }

    const spanId = this.insertMessage(runtime, message)
    this.recomputeSpan(spanId, runtime)
    this.relinkSpans(runtime)
    if (message.id) {
      this.messageIdMap.set(this.remoteMessageKey(message.platform, message.channelId, message.id), message.seq)
    }
    this.metrics.ingested++
    this.ctx.logger('message').info('message ingested: seq=%s platform=%s channelId=%s', message.seq.toString(), message.platform, message.channelId)
    this.ctx.emit('message/created', message, input.payload)
    return message
  }

  deleteMessage(seq: bigint, dead = true): boolean {
    for (const runtime of this.channels.values()) {
      const spanId = runtime.messageSpan.get(seq)
      if (!spanId)
        continue
      const span = runtime.spans.get(spanId)
      if (!span)
        return false
      const target = span.data.find(item => item.seq === seq)
      if (!target)
        return false
      target.dead = dead
      this.recomputeSpan(spanId, runtime)
      this.metrics.deadMarked++
      this.ctx.emit('message/dead', seq, dead)
      return true
    }
    this.ctx.emit('message/dead', seq, dead)
    return false
  }

  listByChannel(platform: string, channelId: string, limit = 50): AppMessage[] {
    const runtime = this.channels.get(this.channelKey(platform, channelId))
    if (!runtime)
      return []
    const ordered = this.getSortedMessages(runtime)
    return ordered.slice(Math.max(0, ordered.length - limit))
  }

  private getSortedMessages(runtime: ChannelRuntime): AppMessage[] {
    if (runtime.sortedCache)
      return runtime.sortedCache
    const sorted = runtime.spanOrder
      .flatMap(spanUid => runtime.spans.get(spanUid)?.data || [])
      .sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)
    runtime.sortedCache = sorted
    return sorted
  }

  private invalidateSortedCache(runtime: ChannelRuntime) {
    runtime.sortedCache = null
  }

  listSpans(platform: string, channelId: string): SpanRuntime[] {
    const runtime = this.channels.get(this.channelKey(platform, channelId))
    if (!runtime)
      return []
    return runtime.spanOrder
      .map(spanUid => runtime.spans.get(spanUid))
      .filter((span): span is SpanRuntime => !!span)
      .map(span => ({ ...span, data: [...span.data] }))
  }

  // seq layout: (timestamp_ms & 0x3FFFFFFFFFFn) << 12 | 12-bit counter
  seqGenerator(timestamp: number, prevSeq?: bigint, nextSeq?: bigint): bigint {
    const timestampBits = BigInt(timestamp) & 0x3FFFFFFFFFFn
    let sequence: number
    if (nextSeq !== undefined) {
      const nextTimestamp = (nextSeq >> 12n) & 0x3FFFFFFFFFFn
      if (nextTimestamp === timestampBits) {
        const nextSequence = Number(nextSeq & 0xFFFn)
        sequence = nextSequence - 1
      }
      else {
        sequence = 4095
      }
    }
    else if (prevSeq !== undefined) {
      const prevTimestamp = (prevSeq >> 12n) & 0x3FFFFFFFFFFn
      if (prevTimestamp === timestampBits) {
        const prevSequence = Number(prevSeq & 0xFFFn)
        sequence = prevSequence + 1
      }
      else {
        sequence = 0
      }
    }
    else {
      sequence = 2048
    }

    sequence = Math.max(0, Math.min(4095, sequence))
    if (sequence === 0 || sequence === 4095)
      this.ctx.logger('message').warn('seq counter saturated at %d for timestamp %d', sequence, timestamp)
    return (timestampBits << 12n) | BigInt(sequence)
  }

  private channelKey(platform: string, channelId: string): string {
    return `${platform}:${channelId}`
  }

  private ensureChannelRuntime(platform: string, channelId: string): ChannelRuntime {
    const key = this.channelKey(platform, channelId)
    const existed = this.channels.get(key)
    if (existed)
      return existed

    const runtime: ChannelRuntime = {
      platform,
      channelId,
      spans: new Map(),
      spanOrder: [],
      messageSpan: new Map(),
      persisted: new Set(),
      sortedCache: null,
    }
    this.channels.set(key, runtime)
    return runtime
  }

  private findNeighbor(runtime: ChannelRuntime, timestamp?: number): { left?: AppMessage, right?: AppMessage } {
    const ordered = runtime.spanOrder
      .flatMap(spanUid => runtime.spans.get(spanUid)?.data || [])
      .sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)
    if (!ordered.length)
      return {}

    if (timestamp === undefined) {
      return { left: ordered[ordered.length - 1] }
    }

    let left: AppMessage | undefined
    let right: AppMessage | undefined
    for (const item of ordered) {
      const itemTimestamp = item.createdAt ?? this.extractTimestamp(item.seq)
      const leftTimestamp = left?.createdAt ?? (left ? this.extractTimestamp(left.seq) : undefined)
      const rightTimestamp = right?.createdAt ?? (right ? this.extractTimestamp(right.seq) : undefined)
      if (itemTimestamp <= timestamp) {
        if (!left || itemTimestamp > leftTimestamp! || (itemTimestamp === leftTimestamp && item.seq > left.seq)) {
          left = item
        }
      }
      if (itemTimestamp >= timestamp) {
        if (!right || itemTimestamp < rightTimestamp! || (itemTimestamp === rightTimestamp && item.seq < right.seq)) {
          right = item
        }
      }
    }

    return { left, right }
  }

  private insertMessage(runtime: ChannelRuntime, message: AppMessage): string {
    this.invalidateSortedCache(runtime)
    const leftNeighbor = this.findSpanNeighborBySeq(runtime, message.seq, false)
    const rightNeighbor = this.findSpanNeighborBySeq(runtime, message.seq, true)
    const leftSpanId = leftNeighbor ? runtime.messageSpan.get(leftNeighbor.seq) : undefined
    const rightSpanId = rightNeighbor ? runtime.messageSpan.get(rightNeighbor.seq) : undefined

    if (leftSpanId && rightSpanId && leftSpanId === rightSpanId) {
      const span = runtime.spans.get(leftSpanId)
      if (!span)
        throw new Error('invalid span cache state')
      span.data.push(message)
      span.data.sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)
      runtime.messageSpan.set(message.seq, span.uid)
      return span.uid
    }

    if (leftSpanId && rightSpanId && leftSpanId !== rightSpanId) {
      const leftSpan = runtime.spans.get(leftSpanId)
      const rightSpan = runtime.spans.get(rightSpanId)
      if (!leftSpan || !rightSpan)
        throw new Error('invalid span merge state')
      const merged: SpanRuntime = {
        ...leftSpan,
        uid: this.createSpanUid(),
        data: [...leftSpan.data, message, ...rightSpan.data],
      }
      merged.data.sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)
      runtime.spans.delete(leftSpanId)
      runtime.spans.delete(rightSpanId)
      runtime.spanOrder = runtime.spanOrder.filter(uid => uid !== leftSpanId && uid !== rightSpanId)
      runtime.spans.set(merged.uid, merged)
      runtime.spanOrder.push(merged.uid)
      for (const item of merged.data) {
        runtime.messageSpan.set(item.seq, merged.uid)
      }
      return merged.uid
    }

    if (leftSpanId || rightSpanId) {
      const targetSpanId = leftSpanId || rightSpanId
      const span = runtime.spans.get(targetSpanId!)
      if (!span)
        throw new Error('invalid single-side span state')
      span.data.push(message)
      span.data.sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)
      runtime.messageSpan.set(message.seq, span.uid)
      return span.uid
    }

    const span: SpanRuntime = {
      uid: this.createSpanUid(),
      type: message.localOnly ? 'local' : 'sync',
      platform: message.platform,
      channelId: message.channelId,
      front: message.seq,
      back: message.seq,
      data: [message],
    }
    runtime.spans.set(span.uid, span)
    runtime.spanOrder.push(span.uid)
    runtime.messageSpan.set(message.seq, span.uid)
    return span.uid
  }

  private findSpanNeighborBySeq(runtime: ChannelRuntime, seq: bigint, findRight: boolean): AppMessage | undefined {
    const ordered = runtime.spanOrder
      .flatMap(spanUid => runtime.spans.get(spanUid)?.data || [])
      .sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)
    if (findRight) {
      return ordered.find(item => item.seq > seq)
    }

    for (let index = ordered.length - 1; index >= 0; index--) {
      if (ordered[index].seq < seq)
        return ordered[index]
    }
    return undefined
  }

  private recomputeSpan(spanId: string, runtime: ChannelRuntime): void {
    const span = runtime.spans.get(spanId)
    if (!span)
      return
    span.data.sort((left, right) => left.seq === right.seq ? 0 : left.seq < right.seq ? -1 : 1)
    span.front = span.data[0]?.seq || 0n
    span.back = span.data[span.data.length - 1]?.seq || 0n

    if (!span.data.length)
      return
    for (let index = 0; index < span.data.length; index++) {
      const current = span.data[index]
      if (span.data.length === 1) {
        current.syncFlag = 3
      }
      else if (index === 0) {
        current.syncFlag = 1
      }
      else if (index === span.data.length - 1) {
        current.syncFlag = 2
      }
      else {
        current.syncFlag = 0
      }
    }

    const allPersisted = span.data.every(item => runtime.persisted.has(item.seq))
    if (allPersisted) {
      span.type = 'remote'
      return
    }

    const allLocalOnly = span.data.every(item => item.localOnly)
    span.type = allLocalOnly ? 'local' : 'sync'
  }

  private relinkSpans(runtime: ChannelRuntime): void {
    runtime.spanOrder.sort((leftUid, rightUid) => {
      const left = runtime.spans.get(leftUid)
      const right = runtime.spans.get(rightUid)
      if (!left || !right)
        return 0
      if (left.front === right.front)
        return 0
      return left.front < right.front ? -1 : 1
    })

    for (let index = 0; index < runtime.spanOrder.length; index++) {
      const span = runtime.spans.get(runtime.spanOrder[index])
      if (!span)
        continue
      span.prev = runtime.spanOrder[index - 1]
      span.next = runtime.spanOrder[index + 1]
      this.recomputeSpan(span.uid, runtime)
    }
  }

  private createSpanUid(): string {
    return randomUUID()
  }

  private markPersisted(seq: bigint): void {
    for (const runtime of this.channels.values()) {
      const spanId = runtime.messageSpan.get(seq)
      if (!spanId)
        continue
      runtime.persisted.add(seq)
      this.recomputeSpan(spanId, runtime)
      return
    }
  }

  private extractTimestamp(seq: bigint): number {
    return Number((seq >> 12n) & 0x3FFFFFFFFFFn)
  }

  private findMessageBySeq(seq: bigint): AppMessage | undefined {
    for (const runtime of this.channels.values()) {
      const spanId = runtime.messageSpan.get(seq)
      if (!spanId)
        continue
      const span = runtime.spans.get(spanId)
      if (!span)
        continue
      return span.data.find(item => item.seq === seq)
    }
    return undefined
  }

  private asBigint(value: unknown, fallback: bigint): bigint {
    if (typeof value === 'bigint')
      return value
    if (typeof value === 'number' && Number.isFinite(value))
      return BigInt(Math.trunc(value))
    if (typeof value === 'string' && value) {
      try {
        return BigInt(value)
      }
      catch {
        return fallback
      }
    }
    return fallback
  }

  private asPersistedMessage(input: Record<string, unknown>): AppMessage {
    const timestamp = Number(input.timestamp || input.createdAt || Date.now())
    const fallbackSeq = this.seqGenerator(timestamp)
    const seq = this.asBigint(input.seq, fallbackSeq)

    return {
      ...(input as Partial<AppMessage>),
      seq,
      platform: String(input.platform || ''),
      channelId: String(input.channelId || ''),
      syncFlag: Number(input.syncFlag ?? 0) as 0 | 1 | 2 | 3,
      dead: Boolean(input.dead),
      localOnly: Boolean(input.localOnly),
      isEvent: Boolean(input.isEvent),
      createdAt: Number(input.createdAt || timestamp),
      timestamp,
      updatedAt: Number(input.updatedAt || Date.now()),
    }
  }

  private handleError(stage: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    this.metrics.errors++
    this.ctx.emit('message/error', stage, message)
    this.ctx.logger('message').warn('%s failed: %s', stage, message)
  }

  private markDegraded(reason: string): void {
    if (this.degraded)
      return
    this.degraded = true
    this.ctx.emit('message/degraded', reason)
    this.ctx.logger('message').warn(reason)
  }

  private async recoverFromDatabase(): Promise<void> {
    if (this.recoveredOnce)
      return

    const database = this.ctx.database
    if (!database?.get) {
      this.markDegraded('database service unavailable, message domain falls back to in-memory runtime')
      this.recoveredOnce = true
      this.ctx.emit('message/recovered', 0)
      return
    }

    try {
      const startedAt = Date.now()
      const rows = await database.get('message', {}, { limit: 10000, sort: { seq: 'desc' } })
      const list = (Array.isArray(rows) ? rows as AppMessage[] : [])
        .map(item => this.asPersistedMessage(item as unknown as Record<string, unknown>))
        .filter(item => !!item.platform && !!item.channelId)
        .sort((left, right) => {
          if (left.platform !== right.platform)
            return left.platform < right.platform ? -1 : 1
          if (left.channelId !== right.channelId)
            return left.channelId < right.channelId ? -1 : 1
          if (left.seq === right.seq)
            return 0
          return left.seq < right.seq ? -1 : 1
        })

      let recovered = 0
      let currentKey = ''
      let bucket: AppMessage[] = []

      const flushBucket = () => {
        if (!bucket.length)
          return 0
        const first = bucket[0]
        const runtime = this.ensureChannelRuntime(first.platform, first.channelId)
        const inserted = this.restoreChannelRuntime(runtime, bucket)
        bucket = []
        return inserted
      }

      for (const message of list) {
        const key = this.channelKey(message.platform, message.channelId)
        if (currentKey && key !== currentKey) {
          recovered += flushBucket()
        }
        currentKey = key
        bucket.push(message)
      }
      recovered += flushBucket()

      this.metrics.recovered += recovered
      this.ctx.emit('message/recovered', recovered)
      this.ctx.logger('message').info('message recovery completed: %d records (%d ms)', recovered, Date.now() - startedAt)
    }
    catch (error) {
      this.handleError('recover', error)
      this.markDegraded('message recovery failed, service continues in in-memory mode')
      this.ctx.emit('message/recovered', 0)
    }
    finally {
      this.recoveredOnce = true
    }
  }

  private restoreChannelRuntime(runtime: ChannelRuntime, messages: AppMessage[]): number {
    if (!messages.length)
      return 0

    const deduped: AppMessage[] = []
    let lastSeq: bigint | undefined
    for (const item of messages) {
      if (runtime.messageSpan.has(item.seq))
        continue
      if (lastSeq !== undefined && item.seq === lastSeq)
        continue
      deduped.push(item)
      lastSeq = item.seq
    }

    if (!deduped.length)
      return 0

    const span: SpanRuntime = {
      uid: this.createSpanUid(),
      type: 'remote',
      platform: runtime.platform,
      channelId: runtime.channelId,
      front: deduped[0].seq,
      back: deduped[deduped.length - 1].seq,
      data: deduped,
    }

    runtime.spans.set(span.uid, span)
    runtime.spanOrder.push(span.uid)
    for (const item of deduped) {
      runtime.messageSpan.set(item.seq, span.uid)
      runtime.persisted.add(item.seq)
      if (item.id) {
        this.messageIdMap.set(this.remoteMessageKey(item.platform, item.channelId, item.id), item.seq)
      }
    }
    this.recomputeSpan(span.uid, runtime)
    this.relinkSpans(runtime)
    return deduped.length
  }

  private remoteMessageKey(platform: string, channelId: string, messageId: string): string {
    return `${platform}:${channelId}:${messageId}`
  }
}

export default AppMessageService
