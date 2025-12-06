import { Context, Service } from 'cordis'
import { } from 'minato'
import { } from './types'

declare module 'cordis' {
  interface Context {
    appMessage: AppMessageService
  }
}

export class AppMessageService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'app-message')
  }

  [Service.setup]() {

  }

  /**
   * Generate a 64-bit sequence number for messages.
   * @param timestamp Message timestamp (milliseconds)
   * @param prevSeq Sequence number of the previous message (if there is a continuous message on the left)
   * @param nextSeq Sequence number of the next message (if there is a continuous message on the right)
   * @returns 64-bit sequence number
   */
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
    const seq = (timestampBits << 12n) | BigInt(sequence)
    return seq
  }
}
