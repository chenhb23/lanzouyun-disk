import got from 'got'
// import {HttpsProxyAgent} from 'hpagent'
import {cookieJar, shareCookieJar} from './cookie'
import config from '../project.config'
import {message} from '../renderer/component/Message'

const base = got.extend({
  headers: {
    'accept-language': 'zh-CN,zh;q=0.9',
    pragma: 'no-cache',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  },
  hooks: {
    afterResponse: [
      async response => {
        // 返回值状态判断，1,2 成功
        if (response.headers['content-type']?.includes('text/json')) {
          const body = JSON.parse(response.body as string)
          if (![1, 2].includes(body.zt)) {
            throw new Error(typeof body.info === 'string' ? body.info : body.text)
          }
        }
        return response
      },
    ],
    beforeError: [
      error => {
        // todo: 记录
        console.error(error)
        message.info(error.message)
        return error
      },
    ],
  },
  // 开发用
  // agent: {
  //   https: new HttpsProxyAgent({
  //     // keepAlive: true,
  //     // keepAliveMsecs: 1000,
  //     // maxSockets: 256,
  //     // maxFreeSockets: 256,
  //     // scheduling: 'lifo',
  //     rejectUnauthorized: false,
  //     proxy: 'http://127.0.0.1:9091',
  //   }),
  // },
})

export const request = got.extend(base, {
  cookieJar,
  prefixUrl: config.lanzouUrl,
})

export const share = got.extend(base, {
  cookieJar: shareCookieJar,
})
