/**
 * preload 运行在渲染进程
 */
import {nativeTheme} from 'electron'

const api = {
  logout: async () => {},
}

global.api = api

// contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: typeof api
  }
}
