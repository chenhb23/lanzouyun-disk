import {BrowserWindow, ipcMain} from 'electron'
import path from "path"

let _win: BrowserWindow

function setupTrigger() {
  ipcMain.handle('trigger', async (event, method: string, ...args) => {
    const [prefix, mod] = method.replace(/(\.{1,2}\/)?([\w.]+)$/, '$1,$2').split(',')
    let [module, ...func] = mod.split('.')
    if (prefix) {
      module = require(prefix + module).default;
    } else {
      module = require(module)
    }

    if (func.length === 1) {
      return module[func[0]](...args)
    } else {
      return module[func[0]][func[1]](...args)
    }
  })
}

function setupDownload(win: BrowserWindow) {
  ipcMain.on('download', (event, downloadUrl, folderPath) => {
    win?.webContents?.session?.once("will-download", (event, item, webContents) => {
      console.log(item.getFilename(), folderPath)
      console.log(downloadUrl)

      if (folderPath) item.setSavePath(path.resolve(folderPath, item.getFilename()))

      item.on("updated", (event1, state) => {
        if (state === "progressing") {
          if (item.isPaused()) {
            console.log('Download is paused');
          } else {
            // todo: 更新进度
            console.log(`Received bytes: ${item.getReceivedBytes()}`)
          }
        } else if (state === 'interrupted') {
          console.log('Download is interrupted but can be resumed')
          // check file name
        }
      })

      item.once("done", (event1, state) => {
        if (state === "completed") {
          // todo: 给个提示？
          console.log('Download successfully');
        } else {
          console.log(`Download failed: ${state}`)
        }
        // todo: 移除列表任务
      })
    })

    _win.webContents.downloadURL(downloadUrl)
  })
}

function setupDialog() {

}

export function unsetup() {
  ipcMain.removeHandler('trigger')
}

export function setup(win: BrowserWindow) {
  unsetup()
  _win = win
  setupTrigger()
  setupDownload(win)
}
