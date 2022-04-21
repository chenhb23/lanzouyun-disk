import {ipcRenderer} from 'electron'
import IpcEvent from '../common/IpcEvent'

const electronApi = {
  logout: () => {
    localStorage.removeItem('upload')
    localStorage.removeItem('download')
    ipcRenderer.send(IpcEvent.logout)
  },
}

export default electronApi
