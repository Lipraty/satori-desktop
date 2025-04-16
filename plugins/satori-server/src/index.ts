import { Context, Service } from '@satoriapp/main'
import { } from './utils'

declare module '@satoriapp/main' {
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
