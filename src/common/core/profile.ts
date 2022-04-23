import * as http from '../http'
import cheerio from 'cheerio'

enum PROFILE_EL {
  个性域名 = '个性域名', // domain
  最近登录时间 = '最近登录时间', // lastLogin
  允许上传类型 = '允许上传类型', // supportList
  单个文件大小 = '单个文件大小', // maxSize
  安全验证 = '安全验证', // verification
}

export async function profile() {
  const html = await http.request.get('mydisk.php?item=profile&action=mypower').text()
  const $ = cheerio.load(html)
  return $('.mf')
    .filter((index, value) => {
      return Object.values(PROFILE_EL).some(name => $('.mf1', value).text()?.includes(name))
    })
    .toArray()
    .reduce((prev, el) => {
      const label = $('.mf1', el).text().trim().replace(/:$/, '')
      switch (label) {
        case PROFILE_EL.个性域名:
          return {...prev, domain: $('#domaindiynow', el).text()}
        case PROFILE_EL.最近登录时间:
          return {...prev, lastLogin: $('.mf2', el).text()}
        case PROFILE_EL.允许上传类型:
          return {...prev, supportList: $('.mf2', el).html().split('<br>').join(',').split(',')}
        case PROFILE_EL.单个文件大小:
          return {...prev, maxSize: $('font', el).text().trim()}
        case PROFILE_EL.安全验证:
          return {...prev, verification: $('#phone_id', el).text().trim()}
      }
      return prev
    }, {})
}
