import requireModule from "../main/requireModule";
import {RequestOptions} from "https";
import config from '../main/project.config'
import store from "../main/store";

const querystring = requireModule('querystring')
const http = requireModule('https')
const Form = requireModule('form-data')

const form = new Form()
type Fm = typeof form

let cookie = ''
const defaultPath = '/doupload.php'

function parseJson(str) {
  try {return JSON.parse(str)}
  catch (e) {return str}
}

export const baseHeaders = {
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  "accept-language": "zh-CN,zh;q=0.9",
  "pragma": "no-cache",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
}

interface RequestParams<T extends object | Fm> extends RequestOptions {
  body?: T
  onData?: (bytes: number) => void
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
    let headers = {
      ...baseHeaders,
      cookie,
      ...params.headers,
    }

    let data = ''
    const body: Fm = params.body
    if (body) {
      if (body instanceof Form) {
        console.log('form upload')
        Object.assign(headers, (body as Fm).getHeaders())
      } else {
        data = querystring.stringify(body)
      }
    }

    // console.log('options', options, headers)

    const req = http.request({...options, headers}, res => {
      let data = ''
      res.setEncoding('utf8')
      res.on("data", chunk => (data += chunk))
      res.on("end", () => {
        const json = parseJson(data)
        console.log(`${options.path}：`)
        console.log(json)
        resolve(json)
      })
      res.on("error", reject)
    })

    if (data) {
      req.write(data)
      req.end()
    } else {
      if (typeof params.onData === "function") {
        let bytes = 0;
        body.on("data", chunk => {
          bytes += chunk.length
          params.onData(bytes)
          // console.log(bytes)
        })
      }

      body.pipe(req)
    }
  })
}

export default request
