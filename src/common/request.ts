import requireModule from './requireModule'
import {RequestOptions} from 'https'
import config from '../project.config'
import store from '../main/store'

const querystring = requireModule('querystring')
const http = requireModule('https')
const Form = requireModule('form-data')
const fs = requireModule('fs-extra')

const form = new Form()
type Fm = typeof form

let cookie = ''
const defaultPath = '/doupload.php'

function parseJson(str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return str
  }
}

export const baseHeaders = {
  accept: 'application/json, text/javascript, */*; q=0.01',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'accept-language': 'zh-CN,zh;q=0.9',
  pragma: 'no-cache',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
}

interface RequestParams<T extends Record<string, unknown> | Fm> extends RequestOptions {
  body?: T
  onData?: (bytes: number) => void
  signal?: AbortSignal
}

/**
 *
 */
function request<T, B>(params: RequestParams<B>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const url = new URL(config.lanzouUrl)
    const options: RequestOptions = {
      method: params.method || 'post',
      protocol: params.protocol || url.protocol,
      host: params.host || url.host,
      path: params.path ?? defaultPath,
    }

    if (!cookie) {
      cookie = await store.get('cookie')
    }
    const headers = {
      ...baseHeaders,
      cookie,
      ...params.headers,
    }

    let data = ''
    const body: Fm = params.body
    if (body) {
      if (body instanceof Form) {
        Object.assign(headers, (body as Fm).getHeaders())
      } else {
        data = querystring.stringify(body)
      }
    }

    const req = http.request({...options, headers}, res => {
      let data = ''
      res.setEncoding('utf8')
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        const json = parseJson(data)
        resolve(request.intercepter.response(json) || json)
      })
      res.on('error', reject)
    })

    if (params.signal) {
      params.signal.onabort = () => {
        req.once('abort', () => reject('request 取消!'))
        req.abort()
      }
    }

    if (data) {
      req.write(data)
      req.end()
    } else {
      if (typeof params.onData === 'function') {
        let bytes = 0
        body.on('data', chunk => {
          bytes += chunk.length
          params.onData(bytes)
          // console.log(bytes)
        })
      }

      body.pipe(req)
    }
  })
}

request.intercepter = {
  response<T extends LZRequest>(res: T): T {
    return res
  },
}

export default request

interface DownloadFile {
  url: string
  resolvePath: string
  onProgress?: (receive: number, total?: number) => void
  signal?: AbortSignal
}

/**
 * nodejs 下载文件
 * @deprecated 会有重定向问题，暂不使用
 */
export function downloadFile(options: DownloadFile) {
  return new Promise((resolve, reject) => {
    let totalBytes = 0
    let receivedBytes = 0

    const req = http
      .get(options.url, baseHeaders, res => {
        const out = fs.createWriteStream(options.resolvePath, {
          // flags: 'w',
        })
        res.pipe(out)
        res.on('data', chunk => {
          receivedBytes += chunk.length
          options.onProgress?.(receivedBytes, totalBytes)
        })
        res.on('end', () => {
          console.log('download end:', receivedBytes, totalBytes)
          resolve()
        })
        res.on('error', reject)
      })
      .on('response', response => {
        console.log('response', response)
        totalBytes = +response.headers['content-length']
      })

    if (options.signal) {
      options.signal.onabort = () => {
        req.abort()
        console.log('取消 downloadFile！')
      }
    }
  })
}
