import { Context } from 'cordis'
import { KeyboardEvent, Menu, nativeImage, Point, Rectangle, Tray } from 'electron'

declare module 'cordis' {
  interface Events {
    'tray/click': (keyboard: KeyboardEvent, bounds: Rectangle, position: Point) => void
    'tray/double-click': () => void
  }
}

export const name = 'tray'

export const inject = ['app']

export async function apply(ctx: Context) {
  const trayIcon = nativeImage.createFromPath(
    process.platform === 'darwin'
      ? 'src/assets/tray/trayTemplate.png'
      // from other platforms, use the windows's tray icon
      : 'src/assets/tray/tray.png'
  )
  const tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' },
  ])

  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)
  tray.on('click', (k, b, p) => ctx.emit('tray/click', k, b, p))
  tray.on('double-click', () => ctx.emit('tray/double-click'))

  ctx.on('dispose', () => tray.destroy())
}
