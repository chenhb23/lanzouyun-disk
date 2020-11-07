import cheerio from 'cheerio'
import {Matcher} from './ls'
import {baseHeaders} from '../request'
import requireModule from '../requireModule'
import {autorun, observable} from 'mobx'
import IpcEvent from '../IpcEvent'

const electron = requireModule('electron')
const querystring = requireModule('querystring')

/**
 * 生成 is_newd, f_id
 */
export function parseUrl(url: string) {
  const parse = new URL(url)
  return {
    is_newd: parse.origin,
    f_id: parse.pathname.replace(/^\//, ''),
  }
}

/**
 * 解析真实下载链接
 */
export async function parseTargetUrl(url: string) {
  const info = parseUrl(url)
  // 以下操作不需要 cookie
  const value = await fetch(url, {headers: baseHeaders}).then(value => value.text())
  const [_, downloadFrame] = value.match(/<iframe.*src="(\/fn\?\w{5,}?)"/)

  const value1 = await fetch(info.is_newd + downloadFrame).then(value1 => value1.text())
  const [__, ajaxdata] = value1.match(/var ajaxdata = '(.*?)'/)

  const value2 = await fetch(`${info.is_newd}/ajaxm.php`, {
    method: 'post',
    headers: baseHeaders,
    body: querystring.stringify({
      action: 'downprocess',
      sign: ajaxdata,
      ves: 1,
    }),
  }).then<DownloadUrlRes>(value2 => value2.json())

  return `${value2.dom}/file/${value2.url}`
}

/**
 * 带密码的文件下载链接
 * script
 */
export async function pwdFileDownUrl(url: string, pwd: string) {
  const {is_newd} = parseUrl(url)
  const html = await fetch(url).then(value => value.text())

  const body = new Matcher(html).matchPwd('url').matchPwd('data').done()

  if (!body.data) {
    throw new Error('文件密码页面解析出错')
  }
  const search = new URLSearchParams(body.data)
  const action = search.get('action')
  const sign = search.get('sign')

  const value = await fetch(`${is_newd}${body.url}`, {
    method: 'post',
    headers: baseHeaders,
    body: querystring.stringify({
      action,
      sign,
      p: pwd,
    }),
  }).then<DownloadUrlRes>(value => value.json())

  return {
    name: value.inf,
    url: `${value.dom}/file/${value.url}`,
  }
}

/**
 * 文件下载链接, 不带密码
 * iframe
 */
export async function fileDownUrl(url: string) {
  const {is_newd} = parseUrl(url)
  const html = await fetch(url).then(value => value.text())
  const {iframe} = new Matcher(html).matchIframe().done()
  if (!iframe) {
    throw new Error('文件页面解析出错')
  }
  const downHtml = await fetch(is_newd + iframe).then(value => value.text())
  const {ajaxdata} = new Matcher(downHtml).matchVar('ajaxdata').done()
  if (!ajaxdata) {
    throw new Error('ajaxdata 无法解析')
  }
  const value = await fetch(`${is_newd}/ajaxm.php`, {
    method: 'post',
    headers: baseHeaders,
    body: querystring.stringify({
      action: 'downprocess',
      sign: ajaxdata,
      ves: 1,
    }),
  }).then<DownloadUrlRes>(value => value.json())

  return {
    name: value.inf,
    url: `${value.dom}/file/${value.url}`,
  }
}

/**
 * 通过url获取下载页信息
 * 文件：加密: name(文件), size; 未加密: name, size
 * 文件夹：加密: name; 未加密: name
 */
export async function downloadPageInfo(options: {url: string; pwd?: string}) {
  const html = await fetch(options.url).then(value => value.text())
  const $ = cheerio.load(html)
  const name = $('title').text().replace(' - 蓝奏云', '')
  return options.pwd
    ? {
        name,
        size: $('.n_filesize').text().replace('大小：', ''),
      }
    : {
        name,
        size: $('table tr td')
          .text()
          .match(/文件大小：(.*)/)?.[1],
      }
}

/**
 * 等待状态的返回
 */
const waitStatus = (observableQueue, sign) => {
  return new Promise(resolve => {
    autorun(
      r => {
        if (!observableQueue.length || observableQueue[0] === sign) {
          r.dispose()
          resolve()
        }
      }
      // ,{delay: 100}
    )
  })
}
/**
 * 向主线程发送下载任务
 */
const downloadTaskFactory = () => {
  const queue = observable([])
  return (ipcMessage: IpcDownloadMsg) =>
    new Promise(async (resolve, reject) => {
      const sign = ipcMessage.replyId
      queue.push(sign)
      await waitStatus(queue, sign)

      electron.ipcRenderer.send(IpcEvent.download, ipcMessage)
      electron.ipcRenderer.once(`${IpcEvent.start}${ipcMessage.replyId}`, () => {
        console.log('download start:', ipcMessage.folderPath)
        queue.shift()
        resolve()
      })
      // todo: 超时时间？
    })
}
export const sendDownloadTask = downloadTaskFactory()
