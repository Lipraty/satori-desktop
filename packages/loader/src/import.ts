import { Context } from "@satoriapp/main";

import { EntryTree } from "./tree";

export class ImportTree<C extends Context = Context> extends EntryTree<C> {
  constructor(ctx: C) {
    super(ctx)
  }

  async init() {
    super.init()
  }
}
