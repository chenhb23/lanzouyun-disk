import {BrowserWindow, ipcMain} from 'electron'
import path from "path"
import {debounce} from "../common/util";

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
  ipcMain.on('download', (ipcEvent, downloadMsg: IpcDownloadMsg) => {
    const {folderPath, replyId, downUrl} = downloadMsg
    const debounceEvent = debounce((replyId, ...args) => {
      ipcEvent.reply(replyId, ...args)
    })

    win?.webContents?.session?.once("will-download", (event, item, webContents) => {
      console.log('folderPath', downloadMsg, folderPath, item.getFilename())
      if (folderPath) item.setSavePath(path.resolve(folderPath, item.getFilename()))

      item.on("updated", (event1, state) => {
        if (state === "progressing") {
          if (item.isPaused()) {
            // ipcEvent.reply(`pause${replyId}`) // todo
          } else {
            const receivedByte = item.getReceivedBytes()
            debounceEvent(`progressing${replyId}`, receivedByte)
            // console.log(`Received bytes: ${receivedByte}`)
          }
        } else if (state === 'interrupted') {
          ipcEvent.reply(`failed${replyId}`)
          // console.log('Download is interrupted but can be resumed')
          // check file name is correct
        }
      })

      item.once("done", (event1, state) => {
        if (state === "completed") {
          // console.log('Download successfully');
          ipcEvent.reply(`done${replyId}`)
        } else {
          ipcEvent.reply(`failed${replyId}`)
          // console.log(`Download failed: ${state}`)
        }
      })

      ipcEvent.reply(`start${replyId}`)
      // delay(200).then(() => {
      //   ipcEvent.reply(`start${replyId}`)
      // })
    })

    _win.webContents.downloadURL(downUrl)
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
