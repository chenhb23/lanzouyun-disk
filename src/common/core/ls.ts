import cheerio from 'cheerio'
import {byteToSize, delay, sizeToByte} from '../util'
import {Matcher} from './matcher'
import * as http from '../http'

/**
 * 列出文件夹下的所有文件 + 目录
 * cookie
 * @example
 * ls // folder_id
 * ls https://xxxx/xxxx --pwd 123 // url, pwd
 */
export interface LsFiles {
  name: string
  type: URLType
  id: string // 文件id 或者 文件夹id

  icon?: string // 从 source 里面拿
  size?: string
  time?: string
  downs?: string
  source: FileInfo | FolderInfo
}

export interface LsResult {
  info: CrumbsInfo[]
  text: LsFiles[]
}

/**
 * 文件列表
 * @param folder_id
 * @param folderFirst 文件夹优先 true
 */
export async function ls(folder_id: FolderId = -1, folderFirst = true): Promise<LsResult> {
  const [res1, res2] = await Promise.all([lsDir(folder_id), lsFile(folder_id)])

  const folders = res1.text.map(value => ({
    name: value.name,
    type: URLType.folder,
    id: `${value.fol_id}`,
    source: value,
  }))
  const files = res2.map(value => ({
    name: value.name_all,
    type: URLType.file,
    id: `${value.id}`,
    icon: value.icon,
    size: value.size,
    time: value.time,
    downs: value.downs,
    source: value,
  }))

  return {
    info: res1.info,
    text: folderFirst ? [...folders, ...files] : [...files, ...folders],
  }
}

/**
 * 列出文件夹下所有文件
 * cookie
 */
export async function lsFile(folder_id: FolderId) {
  let pg = 1
  let next = true
  const fileList: Task5Res['text'] = []
  do {
    const {text} = await http.request
      .post('doupload.php', {form: {task: 5, folder_id, pg: pg++} as Task5})
      .json<Task5Res>()
    // todo: 蓝奏分页数量：api：18，分享页：50
    next = Array.isArray(text) && text.length >= 18
    if (Array.isArray(text)) {
      fileList.push(...text)
    }
  } while (next)

  return fileList
}

/**
 * 列出该文件夹下的所有文件夹
 * cookie
 */
export async function lsDir(folder_id: FolderId) {
  return http.request.post('doupload.php', {form: {task: 47, folder_id} as Task47}).json<Task47Res>()
}

export interface LsShareObject {
  name: string
  size: string
  type: URLType
  list: LsShareItem[]
}

export interface LsShareItem {
  url: string // 如果文件有密码，则带有 webpage 参数
  name: string
  size: string
  time: string
  pwd?: string
}
export enum URLType {
  file = 'file', // https://wws.lanzous.com/ivvHsi3qyef
  folder = 'folder', // https://wws.lanzous.com/b01tp3zkj
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
  const instance = http.share.get(url)
  const response = await instance
  const html = await instance.text()
  // 覆盖原url（防url重定向）
  url = response.url

  const $ = cheerio.load(html)

  // 根据html区分哪种解析类型
  const isFile = !!$('iframe').length
  const isPwdFile = !!$('#passwddiv').length
  const isPwdFolder = !!$('#pwdload').length
  const isFolder = !!$('#filemore').length && !isPwdFolder // 密码和无密码页面

  if ((isPwdFile || isPwdFolder) && !pwd) {
    throw new Error('密码不能为空')
  }

  const title = $('title').text()
  if (isFile) {
    const name = title.replace(' - 蓝奏云', '') // '(文件名) - 蓝奏云',
    let time = html.match(/上传时间：<\/span>(.*?)<br>/)?.[1]
    if (!time) {
      // https://dkbd.lanzoui.com/dkbdv7
      const memberFile = $('.filename img')
      if (memberFile.length) {
        time = new URL(memberFile.attr('src')).pathname
          .split('/')
          .filter(value => /^\d+$/.test(value))
          .join('-')
      }
    }
    const size = $('meta[name=description]')
      .attr('content')
      .replace(/文件大小：(.+)\|/, '$1')
    return {name, size, type: URLType.file, list: [{url, name, size, time}]}
  } else if (isPwdFile) {
    const ajaxData = Matcher.parsePwdAjax(html, pwd)

    const {inf} = await http
      .share(new URL(ajaxData.url, url), {
        method: ajaxData.type,
        headers: {referer: url},
        form: ajaxData.data,
      })
      .json<DownloadUrlRes>()
    const name = inf // 文件名
    const size = $('meta[name=description]')
      .attr('content')
      .replace(/文件大小：(.+)\|/, '$1')
    const time = $('.n_file_info > .n_file_infos:first-child').text()
    return {name, size, type: URLType.file, list: [{url, pwd, name, size, time}]}
  } else if (isFolder || isPwdFolder) {
    const value = await lsShareFolder({pwd, url, html})
    return {
      name: title, // (文件夹名)
      type: URLType.folder,
      size: byteToSize(value.list?.reduce((total, item) => total + sizeToByte(item.size), 0)),
      list: value.list?.map(item => ({
        url: new URL(item.id, url).toString(),
        name: item.name_all,
        size: item.size,
        time: item.time,
      })),
    }
  } else {
    throw new Error($('.off').text())
  }
}

/**
 * 解析分享文件夹
 * 发送 ajax，如有密码，则带上 pwd
 * @param options
 */
export async function lsShareFolder({url, pwd, html}: {url: string; pwd?: string; html?: string}) {
  if (!html) {
    const instance = http.share.get(url)
    const response = await instance
    url = response.url
    html = await instance.text()
  }

  const $ = cheerio.load(html)
  const title = $('title').text()

  const ajaxData = Matcher.parseFolderAjax(html)

  let pg = 1
  const shareFiles: ShareFile[] = []

  while (true) {
    const {text} = await http
      .share(new URL(ajaxData.url, url), {
        method: ajaxData.type,
        headers: {referer: url},
        form: {...ajaxData.data, pg: pg++, pwd},
      })
      .json<ShareFileRes>()

    if (Array.isArray(text)) {
      shareFiles.push(...text)
    }

    if (Array.isArray(text) && text.length >= 50) {
      await delay(2000)
    } else {
      break
    }
  }

  return {name: title, list: shareFiles}
}
