// declare module global {
//   interface Global {
//     fs: any
//   }
// }

namespace NodeJS {
  import * as fs from 'fs'
  import * as http from 'https'
  import FormData from 'form-data'

  interface Global {
    fs: typeof fs
    http: typeof http
    FormData: FormData
  }
}

interface Window {
  fs: NodeJS.Global["fs"]
  http: NodeJS.Global["http"]
  FormData: NodeJS.Global["FormData"]
}
