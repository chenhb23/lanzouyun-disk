import {Matcher} from './matcher'
import * as http from '../http'

/**
 * 带密码的文件下载链接
 * script
 */
export async function pwdFileDownUrl(url: string, pwd: string) {
  const instance = http.share.get(url)
  const response = await instance
  url = response.url
  const html = await instance.text()

  const ajaxData = await Matcher.parsePwdAjax(html, pwd)

  const value = await http
    .share(new URL(ajaxData.url, url), {
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

  const iframe = Matcher.matchIframe(html)
  if (!iframe) {
    throw new Error('文件页面解析出错')
  }

  const iframeUrl = new URL(iframe, url).toString()
  const downHtml = await http.share.get(iframeUrl).text()

  const ajaxData = await Matcher.parseAjax(downHtml)
  const value = await http
    .share(new URL(ajaxData.url, url), {
      method: ajaxData.type,
      headers: {referer: iframeUrl},
      form: ajaxData.data,
    })
    .json<DownloadUrlRes>()

  return {
    name: value.inf,
    url: `${value.dom}/file/${value.url}`,
  }
}
