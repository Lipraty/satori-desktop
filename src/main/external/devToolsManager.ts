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
    this.ctx.app.whenReady().then(() => {
      installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err))
    })
  }
}
