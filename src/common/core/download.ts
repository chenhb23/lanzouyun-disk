import {baseHeaders} from '../request'
import requireModule from '../requireModule'
import {autorun, observable} from 'mobx'
import IpcEvent from '../IpcEvent'
import {Matcher} from './matcher'

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
 * 带密码的文件下载链接
 * script
 */
export async function pwdFileDownUrl(url: string, pwd: string) {
  const response = await fetch(url)
  url = response.url
  const html = await response.text()

  const {is_newd} = parseUrl(url)

  const ajaxData = Matcher.parsePwdAjax(html, pwd)

  const value = await fetch(`${is_newd}${ajaxData.url}`, {
    method: ajaxData.type,
    headers: {...baseHeaders, 'custom-referer': url},
    body: new URLSearchParams(ajaxData.data),
  }).then<DownloadUrlRes>(value => value.json())

  return {
    name: value.inf,
    url: `${value.dom}/file/${value.url}`,
  }
}

/**
 * 无密码文件下载链接
 * iframe
 */
export async function fileDownUrl(url: string) {
  const response = await fetch(url)
  url = response.url
  const html = await response.text()

  const {is_newd} = parseUrl(url)
  const iframe = Matcher.matchIframe(html)
  if (!iframe) {
    throw new Error('文件页面解析出错')
  }

  const downHtml = await fetch(is_newd + iframe).then(value => value.text())

  const ajaxData = Matcher.parseAjax(downHtml)
  const value = await fetch(`${is_newd}${ajaxData.url}`, {
    method: ajaxData.type,
    headers: {...baseHeaders, 'custom-referer': is_newd + iframe},
    body: new URLSearchParams(ajaxData.data),
  }).then<DownloadUrlRes>(value => value.json())

  return {
    name: value.inf,
    url: `${value.dom}/file/${value.url}`,
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
    new Promise(async resolve => {
      const sign = ipcMessage.replyId
      queue.push(sign)
      await waitStatus(queue, sign)

      electron.ipcRenderer.send(IpcEvent.download, ipcMessage)
      electron.ipcRenderer.once(`${IpcEvent.start}${ipcMessage.replyId}`, () => {
        queue.shift()
        resolve()
      })
      // todo: 超时时间？
    })
}
export const sendDownloadTask = downloadTaskFactory()
