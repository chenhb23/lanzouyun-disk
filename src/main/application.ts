import {app, session, BrowserWindow} from 'electron'
import config from '../project.config'
import store from '../common/store'
import {Cookie} from 'tough-cookie'
import {safeUserAgent} from '../common/util'
import {Extension} from './extension'

export abstract class Application {
  // app 准备事件
  ready() {}
  // 窗口激活事件（在 app.ready 之后）
  activate() {}
  // 窗口创建事件（未加载 URL，需要自己手动加载）
  windowReady(win: BrowserWindow) {}
  // 窗口关闭事件
  closed() {}
  // 登录后触发该事件(已设置 cookie)
  onLogin(win: BrowserWindow, detail: Electron.OnResponseStartedListenerDetails) {}
  // 登出后触发该事件(已删除 cookie)
  onLogout(win: BrowserWindow) {}

  constructor() {
    this._init()
  }

  private _instance: BrowserWindow

  get mainWindow() {
    return this._instance
  }

  set mainWindow(instance: BrowserWindow) {
    if (this._instance && !this._instance.isDestroyed()) {
      this._instance.close()
    }
    this._instance = instance
    if (this._instance) {
      this._instance.on('closed', this.closed.bind(this))
      this.windowReady(this._instance)
    }
  }

  private async _init() {
    await app.whenReady()
    this._prepare()
    this.ready()
    app.on('activate', this.activate.bind(this))
  }

  private _prepare() {
    this._initUA()

    session.defaultSession.webRequest.onResponseStarted(
      {urls: [config.lanzouUrl + config.page.home]},
      this._login.bind(this)
    )
  }

  private _initUA() {
    const ua = session.defaultSession.getUserAgent()
    const userAgent = safeUserAgent(ua)
    store.set('userAgent', userAgent)
    session.defaultSession.setUserAgent(userAgent)
  }

  private async _login(detail: Electron.OnResponseStartedListenerDetails) {
    const cookies = await session.defaultSession.cookies.get({})
    const jarCookies = cookies.map(cookie => {
      const {name, expirationDate, ...rest} = cookie
      return new Cookie({
        ...rest,
        key: name,
        ...(expirationDate ? {expires: new Date(expirationDate * 1000)} : {}),
      })
    })
    store.set('cookies', jarCookies)
    this.onLogin(this.mainWindow, detail)
  }

  async clearAuth() {
    const cookies = await session.defaultSession.cookies.get({})
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
        store.get('cookies', []).filter(value => !cookieNames.includes(value.key))
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
      webPreferences: {
        // preload: path.resolve(__dirname, 'main/preload.js'),
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
