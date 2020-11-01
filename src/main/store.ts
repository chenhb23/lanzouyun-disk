import requireModule from "./requireModule";
import {invoke} from "./utils/invokeIpc";

const electron = requireModule('electron')

export default electron.ipcMain ? new (require('electron-store'))() : {
  get(key: string): Promise<string> {
    return invoke('./store.get', key)
  }
} as any
