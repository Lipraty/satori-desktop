import { Context, Service } from 'cordis'
import { } from './utils'

declare module 'cordis' {
  interface Events {

  }
}

class SatoriServer extends Service {
  constructor(ctx: Context) {
    super(ctx, 'satori-server')
  }
}

namespace SatoriServer { }

export default SatoriServer
