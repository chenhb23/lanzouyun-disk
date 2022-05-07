import {BrowserWindow, dialog, shell, ipcMain} from 'electron'
import IpcEvent from '../common/IpcEvent'
import {Extension} from './extension'
import type {Application} from './application'

// 不能返回无法序列号的对象，如：shell
export class Ipc implements Extension {
  showOpenDialog(event: Electron.IpcMainInvokeEvent, options: Electron.OpenDialogOptions) {
    const win = BrowserWindow.fromWebContents(event.sender)
    return dialog.showOpenDialog(win, options)
  }

  async showItemInFolder(event: Electron.IpcMainInvokeEvent, fullPath: string) {
    return shell.showItemInFolder(fullPath)
  }

  async openExternal(event: Electron.IpcMainInvokeEvent, url: string, options?: Electron.OpenExternalOptions) {
    return shell.openExternal(url, options)
  }

  // 如果文件不存在，会返回提示信息（不是报错信息），如：Failed to open path
  async openPath(event: Electron.IpcMainInvokeEvent, path: string) {
    return shell.openPath(path)
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
    ipcMain.handle(IpcEvent['shell:openExternal'], this.openExternal)
    ipcMain.handle(IpcEvent['shell:openPath'], this.openPath)
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
