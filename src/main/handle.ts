import {BrowserWindow, DownloadItem, ipcMain, dialog, shell} from 'electron'
import path from 'path'
import {debounce, delay} from '../common/util'
import store from './store'
import config from '../project.config'
import IpcEvent from '../common/IpcEvent'

function setupTrigger() {
  ipcMain.handle(IpcEvent.trigger, async (event, method: string, ...args) => {
    const [prefix, mod] = method.replace(/(\.{1,2}\/)?([\w.]+)$/, '$1,$2').split(',')
    const [module, ...func] = mod.split('.')
    const nodeModule = prefix ? require(prefix + module).default : require(module)

    if (func.length === 1) {
      return nodeModule[func[0]](...args)
    } else {
      return nodeModule[func[0]][func[1]](...args)
    }
  })
}

function setupDownload(win: BrowserWindow) {
  const downloadItems: {[replyId: string]: DownloadItem} = {}
  ipcMain.on(IpcEvent.download, (ipcEvent, downloadMsg: IpcDownloadMsg) => {
    const {folderPath, replyId, downUrl} = downloadMsg
    const debounceEvent = debounce((replyId, ...args) => {
      ipcEvent.reply(replyId, ...args)
    })

    win?.webContents?.session?.once('will-download', (event, item) => {
      if (folderPath) item.setSavePath(path.resolve(folderPath, item.getFilename()))
      downloadItems[replyId] = item

      item.on('updated', (event1, state) => {
        if (state === 'progressing') {
          if (item.isPaused()) {
            // ipcEvent.reply(`pause${replyId}`) // todo
          } else {
            const receivedByte = item.getReceivedBytes()
            const totalBytes = item.getTotalBytes()
            debounceEvent(`${IpcEvent.progressing}${replyId}`, receivedByte, totalBytes)
          }
        } else if (state === 'interrupted') {
          ipcEvent.reply(`${IpcEvent.failed}${replyId}`, 'interrupted')
        }
      })

      item.once('done', (event1, state) => {
        if (state === 'completed') {
          ipcEvent.reply(`${IpcEvent.done}${replyId}`)
        } else {
          if (state === 'cancelled') {
            ipcEvent.reply(`${IpcEvent.cancelled}${replyId}`)
          } else {
            ipcEvent.reply(`${IpcEvent.failed}${replyId}`, 'done')
          }
        }
        delete downloadItems[replyId]
      })

      ipcEvent.reply(`${IpcEvent.start}${replyId}`)
    })

    win.webContents.downloadURL(downUrl)
  })

  ipcMain.on(IpcEvent.abort, (ipcEvent, replyId) => {
    if (downloadItems[replyId]) {
      downloadItems[replyId].cancel()
      delete downloadItems[replyId]
    }
  })
}

function setupStore(win: BrowserWindow) {
  ipcMain.handle(IpcEvent.store, async (event, method, ...args) => {
    return store[method]?.(...args)
  })

  // handle?
  ipcMain.on(IpcEvent.logout, () => {
    win.webContents.session.clearStorageData()
    loadLogin(win)
  })
}

function setupDialog(win: BrowserWindow) {
  ipcMain.handle(IpcEvent.dialog, (event, p = 'openDirectory') => {
    return dialog.showOpenDialog(win, {
      title: '选择文件夹',
      properties: [p],
    })
  })

  ipcMain.handle(IpcEvent.shell, (event, method, ...args) => {
    return shell[method]?.(...args)
  })
}

function setupParse() {
  ipcMain.handle('parse', async (event, frame: string) => {
    let win = new BrowserWindow({
      show: false,
      skipTaskbar: true,
      frame: false,
    })

    function listenUrl() {
      return new Promise(resolve => {
        win.webContents.session.webRequest.onResponseStarted(async details => {
          if (details.url.endsWith('/ajaxm.php')) {
            const href = await checkHref()
            resolve(href)
          }
        })
      })
    }

    function checkHref(): Promise<string> {
      return win.webContents
        .executeJavaScript(
          `;(() => {var a = document.querySelector('#go a');return a ? a.getAttribute('href') : null})()`
        )
        .then(value => {
          if (value) return value
          else return delay(300).then(checkHref)
        })
    }

    await win.loadURL(frame)
    const href = await listenUrl()
    delay(500).then(() => {
      win.destroy()
      win = null
    })
    return href
  })
}

let initial = false
export function unsetup() {
  ipcMain.removeHandler(IpcEvent.trigger)
  ipcMain.removeHandler(IpcEvent.store)
  ipcMain.removeHandler(IpcEvent.dialog)
  ipcMain.removeAllListeners(IpcEvent.download)
  ipcMain.removeAllListeners(IpcEvent.abort)
  ipcMain.removeAllListeners(IpcEvent.logout)
  initial = false
}

export function setup(win: BrowserWindow) {
  if (initial) {
    unsetup()
  }
  setupTrigger()
  setupDownload(win)
  setupStore(win)
  setupDialog(win)
  setupParse()

  initial = true
}

export function loadLogin(win: BrowserWindow) {
  return win.loadURL(config.lanzouUrl + config.page.login).then(() => {
    return win.webContents.insertCSS('*{visibility:hidden}.p1{visibility:visible}.p1 *{visibility:inherit}')
  })
}
