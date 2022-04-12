import {Matcher} from './matcher'
import * as http from '../http'

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
  const instance = http.share.get(url)
  const response = await instance
  url = response.url
  const html = await instance.text()

  const {is_newd} = parseUrl(url)

  const ajaxData = Matcher.parsePwdAjax(html, pwd)

  const value = await http
    .share(`${is_newd}${ajaxData.url}`, {
      method: ajaxData.type,
      headers: {referer: url},
      form: ajaxData.data,
    })
    .json<DownloadUrlRes>()

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
  const instance = http.share.get(url)
  const response = await instance
  url = response.url
  const html = await instance.text()

  const {is_newd} = parseUrl(url)
  const iframe = Matcher.matchIframe(html)
  if (!iframe) {
    throw new Error('文件页面解析出错')
  }

  const downHtml = await http.share.get(is_newd + iframe).text()

  const ajaxData = Matcher.parseAjax(downHtml)
  const value = await http
    .share(`${is_newd}${ajaxData.url}`, {
      method: ajaxData.type,
      headers: {referer: is_newd + iframe},
      form: ajaxData.data,
    })
    .json<DownloadUrlRes>()

  return {
    name: value.inf,
    url: `${value.dom}/file/${value.url}`,
  }
}
