import requireModule from "../common/requireModule";
import {invoke} from "../renderer/utils/invokeIpc";

const electron = requireModule('electron')

export default electron.ipcMain ? new (require('electron-store'))() : {
  get(key: string): Promise<string> {
    return invoke('./store.get', key)
  }
} as any
