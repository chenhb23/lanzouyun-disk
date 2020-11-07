import requireModule from '../../common/requireModule'
import IpcEvent from '../../common/IpcEvent'

const electron = requireModule('electron')

export function invoke(method: string, ...args): Promise<any> {
  return electron.ipcRenderer.invoke(IpcEvent.trigger, method, ...args)
}
