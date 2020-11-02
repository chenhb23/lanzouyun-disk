import requireModule from '../common/requireModule'

const electron = requireModule('electron')

export default electron.ipcMain
  ? new (require('electron-store'))()
  : ({
      get(key: string): Promise<string> {
        return electron.ipcRenderer.invoke('store', 'get', key)
      },
    } as any)
