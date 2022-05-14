import {app, BrowserWindow} from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'
import store from '../common/store'
import config from '../project.config'
import {Application} from './application'
import {IpcExtension} from './extensions/ipc'
import {MenuExtension} from './extensions/menu'
import {ThemeExtension} from './extensions/theme'

console.log('process.platform', process.platform) // darwin, win32

const loadURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '..', 'index.html')}`

class App extends Application {
  constructor() {
    super()
  }

  async ready() {
    store.set('isDev', isDev)
    if (!store.get('downloads')) {
      store.set('downloads', app.getPath('downloads'))
    }
    this.createWindow()
  }

  async windowReady(win: Electron.BrowserWindow) {
    const cookie = store.get('cookies', [])?.find(value => value.name === 'phpdisk_info')
    if (cookie) {
      await this.loadMain(win)
    } else {
      await this.clearAuth()
      await this.loadAuth(win)
    }
  }

  async onLogin(win, detail) {
    await this.loadMain(win)
  }

  async onLogout(win: Electron.CrossProcessExports.BrowserWindow) {
    await this.loadAuth(win)
  }

  async loadMain(win: BrowserWindow) {
    await win.loadURL(loadURL)
    if (isDev) {
      win.webContents.openDevTools({mode: 'bottom'})
    }
  }

  async loadAuth(win: BrowserWindow) {
    await win.loadURL(config.lanzouUrl + config.page.login)
    await win.webContents.insertCSS('*{visibility:hidden}.p1{visibility:visible}.p1 *{visibility:inherit}')
  }
}

const electronApp = new App()
electronApp.install(new IpcExtension())
electronApp.install(new MenuExtension())
electronApp.install(new ThemeExtension())
