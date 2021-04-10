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
 * 带密码的文件下载链接
 * script
 */
export async function pwdFileDownUrl(url: string, pwd: string) {
  const {is_newd} = parseUrl(url)
  const html = await fetch(url).then(value => value.text())

  const body = new Matcher(html).matchPwdFile('url').matchPwdFile('data').done()

  if (!body.data) {
    throw new Error('文件密码页面解析出错')
  }

  const value = await fetch(`${is_newd}${body.url}`, {
    method: 'post',
    headers: {...baseHeaders, 'custom-referer': url},
    body: body.data + pwd,
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
  const {ajaxdata, sign, postdown} = new Matcher(downHtml).matchVar('ajaxdata').matchSign().matchPostdown().done()
  if (!ajaxdata) {
    throw new Error('ajaxdata 无法解析')
  }
  const value = await fetch(`${is_newd}/ajaxm.php`, {
    method: 'post',
    headers: {
      ...baseHeaders,
      'custom-referer': is_newd + iframe,
    },
    body: querystring.stringify({
      action: 'downprocess',
      signs: ajaxdata,
      sign: postdown,
      websign: '',
      ves: 1,
      websignkey: 'rnu2',
    }),
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
