import {BrowserWindow, dialog, shell, ipcMain} from 'electron'
import IpcEvent from '../common/IpcEvent'
import type {Application} from './application'
import {Extension} from './extension'

// 不能返回无法序列号的对象，如：shell
export class Ipc implements Extension {
  showOpenDialog(event: Electron.IpcMainInvokeEvent, options: Electron.OpenDialogOptions) {
    const win = BrowserWindow.fromWebContents(event.sender)
    return dialog.showOpenDialog(win, options)
  }

  async showItemInFolder(event: Electron.IpcMainInvokeEvent, fullPath: string) {
    return shell.showItemInFolder(fullPath)
  }

  async logout(event: Electron.IpcMainEvent) {
    await this.app.clearAuth()
    this.app.onLogout(BrowserWindow.fromWebContents(event.sender))
  }

  private app: Application

  install(instance: Application) {
    this.app = instance
    ipcMain.handle(IpcEvent['dialog:showOpenDialog'], this.showOpenDialog)
    ipcMain.handle(IpcEvent['shell:showItemInFolder'], this.showItemInFolder)
    ipcMain.on(IpcEvent.logout, this.logout.bind(this))
  }
}

type IpcEventApi<T> = Pick<
  T,
  {
    [P in keyof T]: T[P] extends (event: infer Event, ...args: any[]) => any
      ? Event extends Electron.IpcMainInvokeEvent | Electron.IpcMainEvent
        ? P
        : never
      : never
  }[keyof T]
>

type RenderApi<T> = {
  [K in keyof T]: T[K] extends (event: any, ...args: infer P) => infer R ? (...args: P) => R : never
}

export type ElectronApi = RenderApi<IpcEventApi<Ipc>>
