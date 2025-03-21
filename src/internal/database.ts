import { Context } from 'cordis'
import * as Minato from 'minato'
//@see https://stackoverflow.com/questions/59906323/typescript-skiplibcheck-still-checking-node-modules-libs
const minato = require('minato')

declare module 'cordis' {
  interface Context {
    [minato.Types]: Types
    [minato.Tables]: Tables
    [Context.Database]: Context.Database<this>
  }
  namespace Context {
    interface Database<C extends Context = Context> { }
  }
}

export interface Tables extends Minato.Tables { }

export interface Types extends Minato.Types { }

export class Database<S extends Tables = Tables, T extends Types = Types, C extends Context = Context> extends Minato.Database<S, T, C> {
  constructor(ctx: C) {
    super(ctx)
  }
}

export default Database
