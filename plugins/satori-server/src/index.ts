import { Context, Service } from '@satoriapp/core'

declare module '@satoriapp/core' {
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
