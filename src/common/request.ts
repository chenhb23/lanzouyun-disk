import requireModule from "./requireModule";
import {RequestOptions} from "https";
import config from '../project.config'
import store from "../main/store";

const querystring = requireModule('querystring')
const http = requireModule('https')
const FD = requireModule('form-data')

function parseJson(str) {
  try {return JSON.parse(str)}
  catch (e) {return str}
}

interface RequestParams extends RequestOptions {
  body?: object | typeof FD
  // baseUrl?: string // todo
}

let cookie = ''
/**
 * todo: 自动获取 cookie
 */
function request(params: RequestParams) {
  return new Promise(async (resolve, reject) => {
    const url = new URL(config.lanzouUrl)
    const options: RequestOptions = {
      method: params.method || 'post',
      protocol: params.protocol || url.protocol,
      host: params.host || url.host,
      path: params.path ?? '/',
    }

    if (!cookie) {
      cookie = await store.get('cookie')
    }
    let headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      "accept-language": "zh-CN,zh;q=0.9",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      cookie,
      ...params.headers,
      // "cookie": store.get('cookie')
    }

    let data = ''
    if (params.body) {
      if (params.body instanceof FD) {
        Object.assign(headers, params.body.getHeaders())
      } else {
        data = querystring.stringify(params.body)
      }
    }

    const req = http.request({
      ...options,
      headers,
    }, res => {
      let data = ''
      res.setEncoding('utf8')
      res.on("data", chunk => (data += chunk))
      res.on("end", () => {
        resolve(parseJson(data))
      })
      res.on("error", reject)
    })

    if (data) {
      req.write(data)
      req.end()
    } else params.body.pipe(req)
  })
}

export default request
