import {contextBridge} from 'electron'

const api = {
  logout: async () => {},
}

global.api = api

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: typeof api
  }
}
