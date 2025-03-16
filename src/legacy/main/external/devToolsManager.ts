import { default as installExtension, REACT_DEVELOPER_TOOLS } from 'electron-extension-installer'

import { Context, Service } from '@main'

export class DevToolsManager extends Service {
  constructor(ctx: Context, _config = {}) {
    super(ctx, 'devTools')

    if (this.ctx.app.isPackaged === false) {
      this.installDevTools()
    }
  }

  async installDevTools() {
    const log = this.ctx.logger
    this.ctx.app.whenReady().then(() => {
      installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
        .then((name) => log.info(`Added Extension:  ${name}`))
        .catch((err) => log.error('An error occurred: ', err))
    })
  }
}
