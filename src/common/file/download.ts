import request, {baseHeaders} from "../request";
import requireModule from "../../main/requireModule";

const querystring = requireModule('querystring')

interface DownloadOptions {
}

/**
 * 添加到下载任务栏
 * 显示下载进度(自带下载速度）
 * 下载文件，合并文件
 * onSuccess
 */
export async function download() {

}

interface DownloadUrlRes {
  dom: string // 域名
  inf: number
  url: string // file/ 的后缀
  zt: number
}

/**
 * 文件id 解析出下载链接
 */
export async function parseDownloadUrl(file_id: FileId) {
  const {info} = await request<Do22Res, Do22>({
    body: {task: 22, file_id}
  })

  // 以下操作不需要 cookie
  const shareUrl = `${info.is_newd}/${info.f_id}`
  const value = await fetch(shareUrl).then(value => value.text())
  const [_, downloadFrame] = value.match(/<iframe.*src="(\/fn\?\w{5,}?)"/)

  const value1 = await fetch(info.is_newd + downloadFrame).then(value1 => value1.text())
  const [__, ajaxdata] = value1.match(/var ajaxdata = '(.*?)'/)

  const value2 = await fetch(`${info.is_newd}/ajaxm.php`, {
    method: 'post',
    headers: baseHeaders,
    body: querystring.stringify({
      action: 'downprocess',
      sign: ajaxdata,
      ves: 1
    })
  }).then<DownloadUrlRes>(value2 => value2.json())

  return `${value2.dom}/file/${value2.url}`

  // if (info.onof === '0') {} // todo: 判断是否需要下载密码
  // data : 'action=downprocess&sign=CW8HOQw9V2ZWXwc4UWFcYABpDzsEbQY0AzdQZFQxVGQBJ1d0Dm5SNwRkVDIAYAc3WjQOPl8xV2VQYQ_c_c&p='+pwd,
}
