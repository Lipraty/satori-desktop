import { Tray, MenuItem, MenuItemConstructorOptions, Menu } from 'electron'

import { Context, Service } from "@main"

export namespace TrayManager {
  export interface Config {
    toolTip: string
    title: string
  }
}

export class trayManager extends Service {
  static inject = ['settings']
  tray: Tray

  constructor(ctx: Context, config: TrayManager.Config) {
    super(ctx, 'tray')

    this.tray = new Tray(ctx.appImage)
    this.tray.setToolTip(config.toolTip)
    this.tray.setTitle(config.title)
  }

  setMenu(templates: (MenuItem | MenuItemConstructorOptions)[]): void {
    const menu = Menu.buildFromTemplate(templates)
    this.tray.setContextMenu(menu)
  }
}
