// Modules to control application life and create native browser window
import {app, BrowserWindow, session} from 'electron'
import * as path from 'path'
import * as querystring from 'querystring'
// import isDev from 'electron-is-dev'
// import config from '../project.config'
const config = {
  "lanzouUrl": "https://up.woozooo.com",
  "page": {
    "home": "/mydisk.php",
    "login": "/account.php?action=login"
  },
  "api": {
    "task": "/doupload.php"
  }
}


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // 不使用网页安全性，跨域
    }
  })

  mainWindow.loadURL(config.lanzouUrl + config.page.login)
  // mainWindow.loadURL(
  //   isDev
  //     ? 'http://localhost:3000'
  //     : `file://${path.join(__dirname, "../build/index.html")}`
  // );

  // mainWindow.webContents.on("did-navigate", (event, url) => {
  //   console.log(url)
  //   console.log(config.lanzouUrl + config.page.home === url)
  // })

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  function setCookies(filter) {
    session.defaultSession.cookies.get(filter).then(value => {
      const cookie = value.map(item => `${item.name}=${item.value}`).join('; ')
      console.log('cookie: ', cookie)
      // todo: 保存 cookie, 跳转
      mainWindow.loadURL('http://localhost:3000')
    })
  }

  session.defaultSession.webRequest.onResponseStarted({
    urls: [config.lanzouUrl + config.api.task],
  }, details => {
    if (details.responseHeaders['Set-Cookie']?.length) {
      const cookieStr = details.responseHeaders['Set-Cookie'].join('; ')
      const cookieObj = querystring.parse(cookieStr, '; ')
      if (cookieObj.domaim) setCookies({domain: cookieObj.domaim})
    } else {
      setCookies({url: config.lanzouUrl})
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
