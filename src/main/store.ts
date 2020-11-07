import requireModule from '../common/requireModule'
import IpcEvent from '../common/IpcEvent'

const electron = requireModule('electron')

export default electron.ipcMain
  ? new (require('electron-store'))()
  : ({
      get(key: string): Promise<string> {
        return electron.ipcRenderer.invoke(IpcEvent.store, 'get', key)
      },
      set(key: string, value) {
        return electron.ipcRenderer.invoke(IpcEvent.store, 'set', key, value)
      },
    } as any)
