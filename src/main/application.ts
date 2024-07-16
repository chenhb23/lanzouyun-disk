import {app, session, BrowserWindow, nativeImage, Tray, Menu} from 'electron'
import config from '../project.config'
import store from '../common/store'
import {Extension} from './extensions/extension'
import {isMacOS, safeUserAgent} from './util'
import isDev from 'electron-is-dev'
import path from 'path'
import * as process from 'node:process'

export abstract class Application {
  // app 准备事件
  ready() {}

  /**
   * 窗口激活事件（在 app.ready 之后）
   * @deprecated 使用 app.on('activate', () => {}) 实现
   */
  private activate() {}

  // 窗口创建事件（未加载 URL，需要自己手动加载）
  windowReady(win: BrowserWindow) {}

  /**
   * 窗口关闭事件
   * @deprecated 在 windowReady 中监听 win.on('closed', () => {}) 实现
   */
  private closed() {}

  // 登录后触发该事件(已设置 cookie)
  onLogin(win: BrowserWindow, detail: Electron.OnResponseStartedListenerDetails) {}
  // 登出后触发该事件(已删除 cookie)
  onLogout(win: BrowserWindow) {}

  // 阻止左上角关闭事件，但可使用 cmd+Q、推盘右键退出、菜单栏 Quit 退出！
  private closeable = false

  protected constructor() {
    // 单一实例锁
    if (!isDev && !app.requestSingleInstanceLock()) {
      app.quit()
    } else {
      this._init()
    }
  }

  private _instance: BrowserWindow

  get mainWindow() {
    return this._instance
  }

  set mainWindow(instance: BrowserWindow) {
    if (this._instance && !this._instance.isDestroyed()) {
      this._instance.destroy()
    }
    this._instance = instance
    if (this._instance) {
      this._instance.on('closed', () => (this.mainWindow = null))
      this._instance.on('close', event => {
        if (!this.closeable) {
          event.preventDefault()
          this.hide()
        }
      })
      this.windowReady(this._instance)
    }
  }

  private hide = () => {
    // Mac 在全屏状态下隐藏，会出现黑屏情况，做特殊处理
    if (isMacOS) {
      if (this.mainWindow.isFullScreen()) {
        this.mainWindow.once('leave-full-screen', () => this._instance.hide())
        this.mainWindow.setFullScreen(false)
        return
      }
    }
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide()
    }
  }

  private show = () => {
    if (!this.mainWindow.isVisible()) {
      this.mainWindow.show()
    }
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }
    if (!this.mainWindow.isFocused()) {
      this.mainWindow.focus()
    }
  }

  private async _init() {
    await app.whenReady()
    this._initUA()
    this._initApp()
    this.ready()
  }

  private _initApp() {
    if (!isDev) {
      // 与单一实例锁关联
      app.on('second-instance', this.show)
    }
    app.on('activate', () => {
      if (!this.mainWindow) {
        this.createWindow()
      } else if (!this.mainWindow.isVisible()) {
        this.mainWindow.show()
      }
    })
    // app.on('window-all-closed', () => {
    //   if (process.platform !== 'darwin') app.quit()
    // })
    app.on('before-quit', () => (this.closeable = true))

    if (!isMacOS) {
      const icon = isDev
        ? path.join(__dirname, '..', '..', '..', 'public', 'icon.png')
        : path.join(__dirname, '..', 'icon.png')
      const image = nativeImage.createFromPath(icon)
      const tray = new Tray(image)
      tray.setToolTip('蓝奏云盘')
      const contextMenu = Menu.buildFromTemplate([
        {label: '显示蓝奏云盘', click: this.show},
        {label: '退出', click: () => app.quit()},
      ])
      tray.on('click', this.show)
      tray.setContextMenu(contextMenu)
    }
  }

  public initSession(lanzouUrl: string) {
    session.defaultSession.webRequest.onResponseStarted({urls: [lanzouUrl + config.page.home]}, this._login.bind(this))
  }

  private _initUA() {
    const ua = session.defaultSession.getUserAgent()
    const userAgent = safeUserAgent(ua)
    store.set('userAgent', userAgent)
    session.defaultSession.setUserAgent(userAgent)
  }

  private async _login(detail: Electron.OnResponseStartedListenerDetails) {
    await new Promise<void>(resolve => process.nextTick(() => resolve()))
    const cookies = await session.defaultSession.cookies.get({})
    const lanzouUrl = new URL(detail.url).origin
    store.set({cookies, lanzouUrl})
    this.onLogin(this.mainWindow, detail)
  }

  async clearAuth() {
    const cookies = await session.defaultSession.cookies.get({})
    await session.defaultSession.clearStorageData({storages: ['localstorage']})
    const cookieNames = ['phpdisk_info']
    const cookie = cookies.filter(value => cookieNames.includes(value.name))
    if (cookie.length) {
      await Promise.all(
        cookie.map(value => {
          const url = (value.secure ? 'https://' : 'http://') + value.domain.replace(/^\./, '') + value.path
          return session.defaultSession.cookies.remove(url, value.name)
        })
      )
      store.set(
        'cookies',
        store.get('cookies', []).filter(value => !cookieNames.includes(value.name))
      )
    }

    // 全部清除
    // const cookies = await session.defaultSession.cookies.get({})
    // await Promise.all(
    //   cookies.map(value => {
    //     const url = (value.secure ? 'https://' : 'http://') + value.domain.replace(/^\./, '') + value.path
    //     return session.defaultSession.cookies.remove(url, value.name)
    //   })
    // )
    // store.delete('cookies')
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      autoHideMenuBar: true,
      webPreferences: {
        webviewTag: true,
        // preload: path.resolve(__dirname, 'preload.js'),
        webSecurity: false, // 不使用网页安全性，跨域
        nodeIntegration: true, // 开启后可在渲染线程 require()
        contextIsolation: false,
      },
    })
  }

  install<T extends Extension>(extension: T) {
    app.whenReady().then(() => extension.install(this))
    return this
  }
}
