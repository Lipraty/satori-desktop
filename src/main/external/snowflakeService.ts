import { Context, Service } from "@main/context"

declare module '@main' {
  interface Context {
    snowflake: SnowflakeService
  }
}

export namespace SnowflakeService {
  export interface Config {
    machineId: number
    epoch?: number
  }
}

export interface SnowflakeService {
  (): string
}

export class SnowflakeService extends Service {
  private epoch: number
  private machineId: number
  private sequence: number
  private lastTimestamp: number

  constructor(ctx: Context, public config: SnowflakeService.Config) {
    super(ctx, 'snowflake')
    this.epoch = config.epoch ?? Date.UTC(2000, 0, 1) // default start from 2000-01-01
    this.machineId = config.machineId & 0x3FF // default 10 bits, max 1023
    this.sequence = 0
    this.lastTimestamp = -1
  }

  private currentTimestamp(): number {
    return Date.now()
  }

  private waitUntilNextMillis(lastTimestamp: number): number {
    let timestamp = this.currentTimestamp()
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp()
    }
    return timestamp
  }

  [Service.invoke](): string {
    let timestamp = this.currentTimestamp()
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xFFF // 12 bits sequence, max 4095

      if (this.sequence === 0) {
        timestamp = this.waitUntilNextMillis(this.lastTimestamp)
      }
    } else {
      this.sequence = 0
    }

    this.lastTimestamp = timestamp

    const timestampPart = (timestamp - this.epoch) & 0x1FFFFFFFFFF // 41 bits timestamp
    const machineIdPart = this.machineId << 12 // 10 bits machine id
    const sequencePart = this.sequence // 12 bits sequence

    const id = (BigInt(timestampPart) << 22n) | BigInt(machineIdPart) | BigInt(sequencePart)

    return id.toString()
  }
}
