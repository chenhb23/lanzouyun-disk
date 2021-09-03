import cheerio from 'cheerio'
import request, {baseHeaders} from '../request'
import {byteToSize, delay, isFile, sizeToByte} from '../util'
import requireModule from '../requireModule'
import {parseUrl} from './download'
import {Matcher} from './matcher'

const querystring = requireModule('querystring')

/**
 * 列出文件夹下的所有文件 + 目录
 * cookie
 * @example
 * ls // folder_id
 * ls https://xxxx/xxxx --pwd 123 // url, pwd
 */
export async function ls(folder_id = -1) {
  const [res1, res2] = await Promise.all([lsDir(folder_id), lsFile(folder_id)])

  const sortFile = a => (isFile(a.name) ? 1 : -1)
  return {
    ...res1,
    text: [...res1.text.sort(sortFile), ...res2],
  }
}

/**
 * 列出文件夹下所有文件
 * cookie
 */
export async function lsFile(folder_id: FolderId) {
  let pg = 1,
    len = 0
  const fileList: Do5Res['text'] = []
  do {
    const {text} = await request<Do5Res, Do5>({body: {task: 5, folder_id, pg: pg++}})
    len = text.length
    fileList.push(...text)
  } while (len)

  return fileList
}

/**
 * 列出该文件夹下的所有文件夹
 * cookie
 */
export async function lsDir(folder_id: FolderId) {
  return request<Do47Res, Do47>({body: {task: 47, folder_id}})
}

export interface LsShareObject {
  name: string
  size: string
  type: ShareType
  list: LsShareItem[]
}

export interface LsShareItem {
  url: string
  name: string
  size: string
  pwd?: string
}
export enum ShareType {
  file, // https://wws.lanzous.com/ivvHsi3qyef
  pwdFile, // https://wws.lanzous.com/i7wyli3mm9e, 8h40
  folder, // https://wws.lanzous.com/b01tp3zkj
  pwdFolder, // https://wws.lanzous.com/b01tp39pi, 34zf
}

/**
 * 文件：
 * * 无密码: iframe
 * * 密码: #passwddiv
 * 文件夹：同一种处理方式
 * * 无密码: #filemore; title
 * * 密码: #pwdload
 */
export async function lsShare({url, pwd}: {url: string; pwd?: string}): Promise<LsShareObject> {
  const response = await fetch(url)
  // 覆盖原url（防url重定向）
  url = response.url
  const html = await response.text()

  // 根据html区分哪种解析类型
  const {is_newd} = parseUrl(url)

  const $ = cheerio.load(html)

  const isFile = $('iframe').length
  const isPwdFile = $('#passwddiv').length
  const isPwdFolder = $('#pwdload').length
  const isFolder = $('#filemore').length && !isPwdFolder // 密码和无密码页面

  if ((isPwdFile || isPwdFolder) && !pwd) {
    throw new Error('密码不能为空')
  }

  const title = $('title').text()
  if (isFile) {
    const name = title.replace(' - 蓝奏云', '') // '(文件名) - 蓝奏云',
    const size = $('table')
      .text()
      .match(/文件大小：(.*)/)?.[1]
    return {name, size, type: ShareType.file, list: [{url, name, size}]}
  } else if (isPwdFile) {
    const body = new Matcher(html).matchPwdFile('url').matchPwdFile('data').done()
    if (!body.url || !body.data) {
      throw new Error('文件密码页面解析出错')
    }
    const {inf} = await fetch(`${is_newd}${body.url}`, {
      method: 'post',
      headers: {...baseHeaders, 'custom-referer': url},
      body: body.data + pwd,
    }).then<DownloadUrlRes>(value => value.json())
    const name = inf // 文件名
    const size = $('.n_filesize').text().replace('大小：', '')
    return {name, size, type: ShareType.pwdFile, list: [{url, pwd, name, size}]}
  } else if (isFolder || isPwdFolder) {
    const value = await lsShareFolder({pwd, url, html})
    return {
      name: title, // (文件夹名)
      type: isFolder ? ShareType.folder : ShareType.pwdFolder,
      size: byteToSize(value.list?.reduce((total, item) => total + sizeToByte(item.size), 0)),
      list: value.list?.map(item => ({url: `${is_newd}/${item.id}`, name: item.name_all, size: item.size})),
    }
  } else {
    throw new Error($('.off').text())
  }
}

/**
 * 解析分享文件夹
 * 发送 ajax，有密码加上 pwd
 * @param options
 */
export async function lsShareFolder({url: paramsUrl, pwd, html}: {url: string; pwd?: string; html?: string}) {
  if (!html) {
    const response = await fetch(paramsUrl)
    paramsUrl = response.url
    html = await response.text()
  }
  const {is_newd} = parseUrl(paramsUrl)

  const $ = cheerio.load(html)
  const title = $('title').text()

  const {url, ...body} = new Matcher(html)
    .matchObject('url')
    .matchDataVar('t')
    .matchDataVar('k')
    .matchData('lx')
    .matchData('fid')
    .matchData('uid')
    .matchData('rep')
    .matchData('up')
    .matchData('ls')
    .done()

  if (!url) {
    return {name: $('.off').text(), list: null}
  }

  let pg = 1
  // let zt
  const shareFiles: ShareFile[] = []

  while (true) {
    const {text, zt} = await fetch(`${is_newd}${url}`, {
      method: 'post',
      headers: {...baseHeaders, 'custom-referer': paramsUrl},
      body: querystring.stringify({...body, pg: pg++, pwd}),
    }).then<ShareFileRes>(value => value.json())

    if (zt == 1 && Array.isArray(text)) {
      shareFiles.push(...(text || []))
      await delay(2000)
    } else {
      break
    }
  }

  return {name: title, list: shareFiles}
}
