import {ipcRenderer} from 'electron'
import IpcEvent from '../common/IpcEvent'
import type {ElectronApi} from '../main/electronApi'

const electronApi: ElectronApi = {
  async trashItem(path: string) {
    return ipcRenderer.invoke(IpcEvent['shell:trashItem'], path)
  },
  async getTheme() {
    return ipcRenderer.invoke(IpcEvent['theme:getTheme'])
  },
  async setTheme(theme) {
    return ipcRenderer.invoke(IpcEvent['theme:setTheme'], theme)
  },
  async openPath(path) {
    return ipcRenderer.invoke(IpcEvent['shell:openPath'], path)
  },
  async logout() {
    localStorage.removeItem('upload')
    localStorage.removeItem('download')
    localStorage.removeItem('finish')
    // 页面卸载后自动销毁 got 实例，上传/下载任务自动停止
    ipcRenderer.send(IpcEvent.logout)
  },
  showItemInFolder(fullPath) {
    return ipcRenderer.invoke(IpcEvent['shell:showItemInFolder'], fullPath)
  },
  showOpenDialog(options) {
    return ipcRenderer.invoke(IpcEvent['dialog:showOpenDialog'], options)
  },
  openExternal(url, options) {
    return ipcRenderer.invoke(IpcEvent['shell:openExternal'], url, options)
  },
}

export default electronApi
