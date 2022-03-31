import IpcEvent from '../../common/IpcEvent'
import electron from 'electron'

export function invoke(method: string, ...args): Promise<any> {
  return electron.ipcRenderer.invoke(IpcEvent.trigger, method, ...args)
}
