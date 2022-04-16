import {BrowserWindow, dialog, ipcMain, shell, session} from 'electron'
import store from '../common/store'
import config from '../project.config'
import IpcEvent from '../common/IpcEvent'

function setupStore() {
  ipcMain.on(IpcEvent.logout, async event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const cookies = store.get('cookies')
    await Promise.all(cookies.map(cookie => session.defaultSession.cookies.remove(config.lanzouUrl, cookie.key)))
    store.delete('cookies')
    await loadLogin(win)
  })
}

function setupDialog() {
  ipcMain.handle(IpcEvent.dialog, (event, p = 'openDirectory') => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return dialog.showOpenDialog(win, {title: '选择文件夹', properties: [p]})
  })

  ipcMain.handle(IpcEvent.shell, (event, method, ...args) => {
    return shell[method]?.(...args)
  })
}

let initial = false
export function unsetup() {
  ipcMain.removeHandler(IpcEvent.dialog)
  ipcMain.removeHandler(IpcEvent.shell)
  ipcMain.removeAllListeners(IpcEvent.logout)
  initial = false
}

export function setup() {
  if (initial) {
    unsetup()
  }
  setupStore()
  setupDialog()

  initial = true
}

export async function loadLogin(win: BrowserWindow) {
  await win.loadURL(config.lanzouUrl + config.page.login)
  await win.webContents.insertCSS('*{visibility:hidden}.p1{visibility:visible}.p1 *{visibility:inherit}')
}
