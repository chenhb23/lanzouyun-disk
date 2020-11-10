import {app, BrowserWindow, session, Menu} from 'electron'
import * as path from 'path'
import * as querystring from 'querystring'
import isDev from 'electron-is-dev'
import store from './main/store'
import {loadLogin, setup} from './main/handle'
import config from './project.config'

const loadURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'index.html')}`

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow

// if (!isDev) {
//   Menu.setApplicationMenu(null)
// }

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    // autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.resolve(__dirname, 'main/preload.js'),
      webSecurity: false, // 不使用网页安全性，跨域
      nodeIntegration: true, // 开启后可在渲染线程 require()
    },
  })

  // todo: [.RendererMainThread-0x7fa53a02c800]GL ERROR :GL_INVALID_OPERATION : glGetIntegerv: incomplete framebuffer
  setup(mainWindow)

  const cookie = store.get('cookie')
  if (!store.get('downloads')) {
    store.set('downloads', app.getPath('downloads'))
  }
  // const cookie = false
  // mainWindow.webContents.session.clearStorageData()

  if (!cookie) {
    loadLogin(mainWindow)
  } else {
    mainWindow.loadURL(loadURL)
    // mainWindow.webContents.openDevTools()
  }
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  function setCookies(filter) {
    session.defaultSession.cookies.get(filter).then(value => {
      const cookie = value.map(item => `${item.name}=${item.value}`).join('; ')
      store.set('cookie', cookie)
      mainWindow.loadURL(loadURL)
    })
  }

  session.defaultSession.webRequest.onBeforeSendHeaders({urls: ['http://*/*', 'https://*/*']}, (details, callback) => {
    // 解决下载链接请求头部的校验问题
    if (details.requestHeaders['custom-referer']) {
      details.requestHeaders['Referer'] = details.requestHeaders['custom-referer']
      delete details.requestHeaders['custom-referer']
      callback({requestHeaders: details.requestHeaders})
    } else {
      callback({})
    }
  })

  session.defaultSession.webRequest.onResponseStarted({urls: [config.lanzouUrl + config.api.task]}, details => {
    if (details.responseHeaders['Set-Cookie']?.length) {
      const cookieStr = details.responseHeaders['Set-Cookie']?.join('; ')
      const cookieObj = querystring.parse(cookieStr, '; ')
      if (cookieObj.domaim) {
        // 按照域名设置 cookie
        setCookies({domain: cookieObj.domaim})
        return
      }
    }

    // 按url
    setCookies({url: config.lanzouUrl})

    if (details.referrer) store.set('referrer', details.referrer)
  })
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
