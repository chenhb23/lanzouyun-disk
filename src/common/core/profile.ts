import * as http from '../http'
import cheerio from 'cheerio'
import {Matcher} from './matcher'
import type {Config} from '../../renderer/store/Config'
import store from '../store'

enum PROFILE_EL {
  个性域名 = '个性域名', // domain
  最近登录时间 = '最近登录时间', // lastLogin
  允许上传类型 = '允许上传类型', // supportList
  单个文件大小 = '单个文件大小', // maxSize
  安全验证 = '安全验证', // verification
}

export async function profile() {
  const [main, my] = await Promise.all([
    http.request.get('mydisk.php').text(),
    http.request.get('mydisk.php?item=profile&action=mypower', {context: {hideMessage: true}}).text(),
  ])

  const $main = cheerio.load(main)
  const $my = cheerio.load(my)
  const profiles = $my('.mf')
    .filter((index, value) => {
      return Object.values(PROFILE_EL).some(name => $my('.mf1', value).text()?.includes(name))
    })
    .toArray()
    .reduce((prev, el) => {
      const label = $my('.mf1', el).text().trim().replace(/:$/, '')
      switch (label) {
        case PROFILE_EL.个性域名:
          return {...prev, domain: $my('#domaindiynow', el).text()}
        case PROFILE_EL.最近登录时间:
          return {...prev, lastLogin: $my('.mf2', el).text()}
        case PROFILE_EL.允许上传类型:
          return {...prev, supportList: $my('.mf2', el).html().split('<br>').join(',').split(',')}
        case PROFILE_EL.单个文件大小:
          return {...prev, maxSize: $my('font', el).text().trim()}
        case PROFILE_EL.安全验证:
          return {...prev, verification: $my('#phone_id', el).text().trim()}
      }
      return prev
    }, {} as Pick<Config, 'referer' | 'domain' | 'lastLogin' | 'maxSize' | 'verification'> & {supportList: string[]})

  const iframe = $main('iframe').attr('src')
  const mainPage = await http.request.get(iframe).text()
  const ajaxData = await Matcher.parseFileMoreAjax(mainPage)

  return {
    ...profiles,
    more: ajaxData,
    referer: new URL(iframe, store.get('lanzouUrl')).href,
  }
}
