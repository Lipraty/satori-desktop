import { Context } from 'cordis'
import * as minato from 'minato'

declare module 'cordis' {
  interface Context {
    // @ts-ignore
    [minato.Types]: Types
    // @ts-ignore
    [minato.Tables]: Tables
    [Context.Database]: Context.Database<this>
  }
  namespace Context {
    interface Database<C extends Context = Context> { }
  }
}

export interface Tables extends minato.Tables { 
  foo: { id: string, name: string }
}

export interface Types extends minato.Types { }

interface AppDatabase extends minato.Database<Tables, Types, Context> {}

class AppDatabase {
  constructor(ctx: Context) {}
}

export default AppDatabase
