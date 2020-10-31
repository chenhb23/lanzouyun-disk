import requireModule from "../../common/requireModule";

const electron = requireModule('electron')

export function invoke(method: string, ...args): Promise<any> {
  return electron.ipcRenderer.invoke('trigger', method, ...args)
}
