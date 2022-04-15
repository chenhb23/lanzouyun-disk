import {ipcRenderer} from 'electron'
import IpcEvent from '../common/IpcEvent'

const electronApi = {
  logout: () => ipcRenderer.send(IpcEvent.logout),
}

export default electronApi
