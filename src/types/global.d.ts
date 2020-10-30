namespace NodeJS {
  import * as fs from 'fs'
  import * as http from 'https'
  import FormData from 'form-data'
  import electron from 'electron'

  interface Global {
    fs: typeof fs
    http: typeof http
    electron: typeof electron
    FormData: FormData
  }
}

interface Window {
  fs: NodeJS.Global["fs"]
  http: NodeJS.Global["http"]
  electron: NodeJS.Global["electron"]
  FormData: NodeJS.Global["FormData"]
}
