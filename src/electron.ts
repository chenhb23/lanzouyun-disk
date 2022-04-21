import {app, BrowserWindow, session, ipcMain, shell, dialog} from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'
import {Cookie} from 'tough-cookie'
import store from './common/store'
import {loadLogin, setup} from './main/handle'
import config from './project.config'
import IpcEvent from './common/IpcEvent'

store.set('isDev', isDev)
// todo: 根据 platform 显示不同外观
console.log('process.platform', process.platform) // darwin, win32

const loadURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'index.html')}`
let mainWindow: BrowserWindow

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    // autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      // preload: path.resolve(__dirname, 'main/preload.js'),
      webSecurity: false, // 不使用网页安全性，跨域
      nodeIntegration: true, // 开启后可在渲染线程 require()
      contextIsolation: false,
    },
  })

  setup()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  async function gotoApp() {
    // const cookies = await session.defaultSession.cookies.get({url: config.lanzouUrl})
    const cookies = await session.defaultSession.cookies.get({url: config.lanzouUrl + config.api.task})
    const jarCookies = cookies.map(
      cookie =>
        new Cookie({
          key: cookie.name,
          value: cookie.value,
          ...(cookie.expirationDate ? {expires: new Date(cookie.expirationDate * 1000)} : {}),
          domain: cookie.domain,
          path: cookie.path,
          hostOnly: cookie.hostOnly,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
        })
    )

    // await Promise.all(jarCookies.map(cookie => cookieJar.setCookie(cookie, config.lanzouUrl)))
    store.set('cookies', jarCookies)
    loadMain(mainWindow)
  }

  session.defaultSession.webRequest.onResponseStarted({urls: [config.lanzouUrl + config.page.home]}, details => {
    // todo: referer: details.url
    console.log('onResponseStarted', details)
    gotoApp()
  })

  if (!store.get('downloads')) {
    store.set('downloads', app.getPath('downloads'))
  }

  const cookies = store.get('cookies', [])
  const token = cookies?.find(value => value.key === 'phpdisk_info')
  if (token && Cookie.fromJSON(token).validate()) {
    loadMain(mainWindow)
  } else {
    store.delete('cookies')
    // const cookies = await session.defaultSession.cookies.get({})
    // for (const cookie of cookies) {
    //   let url = cookie.secure ? 'https://' : 'http://'
    //   if (cookie.domain.startsWith('.')) {
    //     url += 'www'
    //   }
    //   url += cookie.domain
    //   url += cookie.path
    //   await session.defaultSession.cookies.remove(url, cookie.name)
    // }
    await loadLogin(mainWindow)
  }
}

app.once('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function loadMain(win: BrowserWindow) {
  // 解决下载链接请求头部的校验问题（使用 got，直接定义 referer）
  // session.defaultSession.webRequest.onBeforeSendHeaders({urls: ['http://*/*', 'https://*/*']}, (details, callback) => {
  //   if (details.requestHeaders['custom-referer']) {
  //     details.requestHeaders['Referer'] = details.requestHeaders['custom-referer']
  //     delete details.requestHeaders['custom-referer']
  //   }
  //   callback({requestHeaders: details.requestHeaders})
  // })
  console.log('loadURL', loadURL)
  win.loadURL(loadURL, {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  })
  if (isDev) {
    win.webContents.openDevTools()
  }
}

class App {
  private mainWindow: BrowserWindow

  constructor() {
    this.init()
    this.initIPC()
  }

  init() {
    this.createWindow()
    // this.initAppEvent()
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 800,
      // minWidth: 900,
      // minHeight: 600,
      // autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      webPreferences: {
        // preload: path.resolve(__dirname, 'main/preload.js'),
        webSecurity: false, // 不使用网页安全性，跨域
        nodeIntegration: true, // 开启后可在渲染线程 require()
        contextIsolation: false,
        // nativeWindowOpen: true,
      },
    })

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    if (!store.get('downloads')) {
      store.set('downloads', app.getPath('downloads'))
    }

    const cookies = store.get('cookies', [])
    const token = cookies?.find(value => value.key === 'phpdisk_info')
    if (token && Cookie.fromJSON(token).validate()) {
      this.loadMain()
    } else {
      store.delete('cookies')
      this.loadLogin()
    }
  }

  async loadLogin() {
    const win = this.mainWindow
    await win.loadURL(config.lanzouUrl + config.page.login)
    await win.webContents.insertCSS('*{visibility:hidden}.p1{visibility:visible}.p1 *{visibility:inherit}')
  }

  async loadMain() {
    const win = this.mainWindow
    await win.loadURL(loadURL, {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
    })
    if (isDev) {
      win.webContents.openDevTools()
    }
  }

  initAppEvent() {
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  // setup
  initIPC() {
    ipcMain.on(IpcEvent.logout, this.events.logout)
    ipcMain.handle(IpcEvent.dialog, this.events.dialog)
    ipcMain.handle(IpcEvent.shell, this.events.shell)
  }

  events = {
    async logout(event: Electron.IpcMainEvent) {
      const win = BrowserWindow.fromWebContents(event.sender)
      const cookies = await session.defaultSession.cookies.get({})
      for (const cookie of cookies) {
        let url = cookie.secure ? 'https://' : 'http://'
        if (cookie.domain === '.woozooo.com') {
          url += 'pc'
        } else if (cookie.domain.startsWith('.')) {
          url += 'www'
        }
        url += cookie.domain
        url += cookie.path
        await session.defaultSession.cookies.remove(url, cookie.name)
      }

      // const cookies = store.get('cookies')
      // await Promise.all(cookies.map(cookie => session.defaultSession.cookies.remove(config.lanzouUrl, cookie.key)))
      store.delete('cookies')
      await loadLogin(win)
    },
    dialog(event: Electron.IpcMainInvokeEvent, options: Electron.OpenDialogOptions) {
      const win = BrowserWindow.fromWebContents(event.sender)
      // return dialog.showOpenDialog(win, {title: '选择文件夹', properties: [p]})
      return dialog.showOpenDialog(win, options)
    },
    async shell(event: Electron.IpcMainInvokeEvent) {
      return shell
    },
    async getPath(event: Electron.IpcMainInvokeEvent, ...args: Parameters<typeof app.getPath>) {
      return app.getPath(...args)
    },
  }
}

// const a: App['events']

type EventParams<T> = T extends (event: Electron.IpcMainEvent, ...args: infer P) => infer R ? (...args: P) => R : never

type EventType<T> = {
  // [key in keyof T]: T[key] extends (event: Electron.IpcMainEvent, ...args: any) => any ? EventParams<T[key]> : never
  [key in keyof T]: never
}

type PickEvent<T> = Pick<
  T,
  {
    [P in keyof T]: T[P] extends (event: infer E) => any ? (E extends Electron.IpcMainEvent ? P : never) : never
  }[keyof T]
>
// type KeyOmitN
