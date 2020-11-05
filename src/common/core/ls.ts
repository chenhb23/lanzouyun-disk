import request, {baseHeaders} from '../request'
import {isFile} from '../util'
import requireModule from '../requireModule'
const querystring = requireModule('querystring')

interface LsOptions {
  all?: boolean // 查询全部，递归查询（速度较慢）
  // pageSize?: number // todo
  // sort?: string // todo: 排序
}

/**
 * 列出文件夹下的所有文件 + 目录
 * @example
 * ls // folder_id
 * ls https://xxxx/xxxx --pwd 123 // url, pwd
 */
export async function ls(folder_id = -1, {all = true} = {} as LsOptions) {
  const [res1, res2] = await Promise.all([lsDir(folder_id), lsFile(folder_id)])

  const sortFile = a => (isFile(a.name) ? 1 : -1)
  return {
    ...res1,
    text: [...res1.text.sort(sortFile), ...res2],
  }
}

/**
 * 列出文件夹下所有文件
 */
export async function lsFile(folder_id: FolderId) {
  let pg = 1,
    len = 0
  const fileList: Do5Res['text'] = []
  do {
    const {text} = await request<Do5Res, Do5>({
      body: {task: 5, folder_id, pg: pg++},
    })
    len = text.length
    fileList.push(...text)
  } while (len)

  return fileList
}

/**
 * 列出该文件夹下的id
 * @param folder_id
 */
export async function lsDir(folder_id) {
  return request<Do47Res, Do47>({
    body: {task: 47, folder_id},
  })
}

/**
 * 解析分享文件夹
 * @param options
 */
export async function lsShareFolder(options: {url: string; pwd?: string}) {
  const is_newd = new URL(options.url).origin
  const html = await fetch(options.url).then(value => value.text())

  const {url, in7f8l, ...body} = new Matcher(html)
    .matchVar('in7f8l')
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

  // const pageSize = 40
  let pg = 1,
    len = 0
  const shareFiles: ShareFile[] = []

  do {
    const {text} = await fetch(`${is_newd}${url}`, {
      method: 'post',
      headers: baseHeaders,
      body: querystring.stringify({...body, pg: pg++, pwd: options.pwd}),
    }).then<ShareFileRes>(value => value.json())
    len = Array.isArray(text) ? text.length : text

    shareFiles.push(...(text || []))
  } while (len)

  return shareFiles
}

// info: "sucess"
// text: (41) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
// zt: 1

// info: "请刷新，重试"
// text: 0
// zt: 4

class Matcher {
  out: Record<string, any> = {}
  constructor(public html: string) {}

  matchVar(key: string) {
    const result = this.html.match(new RegExp(`var ${key} = '(.+?)';`))
    if (result) {
      this.out[key] = result[1]
    }
    return this
  }

  matchDataVar(key: string) {
    const varName = this.html.match(new RegExp(`'${key}':'?(\\w+)'?,`))
    if (varName) {
      const result = this.html.match(new RegExp(`var ${varName[1]} = '(.+?)';`))
      if (result) {
        this.out[key] = result[1]
      }
    }
    return this
  }

  matchData(key: string) {
    const result = this.html.match(new RegExp(`'${key}':'?(\\w+)'?,`))
    if (result) {
      this.out[key] = result[1]
    }
    return this
  }

  matchObject(key: string) {
    const result = this.html.match(new RegExp(`${key} : '(.+?)',`))
    if (result) {
      this.out[key] = result[1]
    }
    return this
  }

  done() {
    return this.out
  }
}
