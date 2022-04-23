import got from 'got'
import {cookieJar, shareCookieJar} from './cookie'
import config from '../project.config'
import {message} from '../renderer/component/Message'
import store from './store'
import {delay} from './util'
import electronApi from '../renderer/electronApi'

const base = got.extend({
  headers: {
    'accept-language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8',
    pragma: 'no-cache',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    // referer: 'https://pc.woozooo.com/mydisk.php?item=files&action=index',
    // referer: 'https://pc.woozooo.com/mydisk.php?item=files&action=index&u=1702063',
    'user-agent': store.get('userAgent'),
  },
  hooks: {
    afterResponse: [
      async response => {
        // 返回值状态判断
        if (response.headers['content-type']?.includes('text/json')) {
          const body = JSON.parse(response.body as string)
          switch (body.zt) {
            // 1,2 成功
            case 1:
            case 2:
              return response
            case 9:
              message.error('登录信息失效，请重新登录')
              await delay()
              electronApi.logout()
              return response
            default:
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
        message.error(error.message)
        return error
      },
    ],
  },
  ...(store.get('isDev')
    ? {
        // // 开发用
        // agent: {
        //   https: new (require('hpagent').HttpsProxyAgent)({
        //     keepAlive: true,
        //     // keepAliveMsecs: 1000,
        //     // maxSockets: 256,
        //     // maxFreeSockets: 256,
        //     // scheduling: 'lifo',
        //     rejectUnauthorized: false,
        //     proxy: 'http://127.0.0.1:9091',
        //   }),
        // },
      }
    : {}),
})

export const request = got.extend(base, {
  cookieJar,
  prefixUrl: config.lanzouUrl,
})

export const share = got.extend(base, {
  cookieJar: shareCookieJar,
})
