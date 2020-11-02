import {app, BrowserWindow, session} from 'electron'
import * as path from 'path'
import * as querystring from 'querystring'
import isDev from 'electron-is-dev'
import store from './main/store'
import {setup} from './main/handle'
import config from './project.config'

// const isDev = true

const loadURL = 'http://localhost:3000'
// const loadURL = `file://${path.join(__dirname, 'index.html')}`

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    // autoHideMenuBar: true,
    // titleBarStyle: "customButtonsOnHover",
    webPreferences: {
      preload: path.resolve(__dirname, 'main/preload.js'),
      webSecurity: false, // 不使用网页安全性，跨域
      nodeIntegration: true, // 开启后可在渲染线程 require()
      nodeIntegrationInSubFrames: true,
      nodeIntegrationInWorker: true,
    },
  })
  setup(mainWindow)

  const cookie = store.get('cookie')

  if (!cookie) {
    mainWindow.loadURL(config.lanzouUrl + config.page.login)
  } else {
    mainWindow.loadURL(loadURL)
    // mainWindow.webContents.openDevTools()
  }

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

  session.defaultSession.webRequest.onResponseStarted({urls: [config.lanzouUrl + config.api.task]}, details => {
    if (details.responseHeaders['Set-Cookie']?.length) {
      const cookieStr = details.responseHeaders['Set-Cookie'].join('; ')
      const cookieObj = querystring.parse(cookieStr, '; ')
      if (cookieObj.domaim) {
        setCookies({domain: cookieObj.domaim})
        return
      }
    }
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
