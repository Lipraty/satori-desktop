import { Context } from 'cordis'
import * as minato from 'minato'

declare module 'cordis' {
  interface Context {
    [minato.Types]: Types
    [minato.Tables]: Tables
  }
}

export interface Tables extends minato.Tables { }

export interface Types extends minato.Types { }

export class Database extends minato.Database {
  constructor(ctx: Context) {
    super(ctx)
  }
}

export default Database
