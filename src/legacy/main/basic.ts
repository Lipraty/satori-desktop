/**
 * Basic service
 */
import { Context, Service } from '@main'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'

declare module '@main/context' {
  interface Context {
    fs: fsService
  }
}



type FS = typeof fs
type FSKeys = keyof FS

export class fsService extends Service {
  $resources: any[] = []
  constructor(ctx: Context) {
    super(ctx, 'fs')
    ctx.on('dispose', () => this.dispose())
    return new Proxy(this, {
      get(target, p) {
        const fscall = fs[p as FSKeys]
        if (typeof fscall === 'function') {
          target.$resources.push(fscall)
        }
        // return {
        //   [p]: fscall,
        //   [Symbol.asyncDispose]: async () => {
        //     if(fscall && fscall.close)
        //     await fscall.close()
        //   }
        // }
        return fscall
      },
    })
  }

  dispose() {
    this.$resources.forEach(res => {
      if (res && res.close && typeof res.close === 'function') {
        res.close()
      }
    })
    this.$resources = []
  }
}

export interface fsService extends FS { }

export class childProcessService extends Service {
  $childs: any[] = []
  constructor(ctx: Context) {
    super(ctx, 'spwan')
  }

  [Service.invoke](...args: childProcessService.SpawnParams) {
    const child = spawn(...args)
    this.$childs.push(child)
    return child
  }

  dispose() {
    this.$childs.forEach(child => {
      if(child && child.kill){
        child.kill()
      }
    })
    this.$childs = []
  }
}

export namespace childProcessService {
  export type Spawn = typeof spawn
  export type SpawnReturn = ReturnType<Spawn>
  export type SpawnParams = Parameters<Spawn>
}

export interface childProcessService{
  (...args: childProcessService.SpawnParams): childProcessService.SpawnReturn
}
