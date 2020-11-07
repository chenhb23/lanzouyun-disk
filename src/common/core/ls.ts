import cheerio from 'cheerio'
import request, {baseHeaders} from '../request'
import {isFile} from '../util'
import requireModule from '../requireModule'
const querystring = requireModule('querystring')

/**
 * 列出文件夹下的所有文件 + 目录
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
 * 列出该文件夹下的所有文件夹
 */
export async function lsDir(folder_id: FolderId) {
  return request<Do47Res, Do47>({
    body: {task: 47, folder_id},
  })
}

// export async function lsShareFile(options: {url: string; pwd?: string}) {
//   // 带密码，不带密码
//   // 两种解析方式
//   // todo: 根据html区分哪种解析类型
// }

/**
 * 解析分享文件夹
 * 发送 ajax，有密码加上 pwd
 * @param options
 */
export async function lsShareFolder(options: {url: string; pwd?: string}) {
  const is_newd = new URL(options.url).origin
  const html = await fetch(options.url).then(value => value.text())

  const $ = cheerio.load(html)
  const title = $('title').text()
  // console.log("$('title').text()", $('title').text())

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
    return {
      name: $('.off').text(),
      list: null,
    }
  }

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

  return {
    name: title,
    list: shareFiles,
  }
}

export class Matcher {
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

  // 文件，带密码
  matchPwd(key: string) {
    // type : 'post',
    // url : '/ajaxm.php',
    // data : 'action=downprocess&sign=BmABPw4_aDz4IAQA_aV2dRbVozAjVQPwExBTUHNVI2AzQAJgAjXDxXMglpAWcGZgI2Uz4CNlc_bAjYBMA_c_c&p='+pwd,
    // dataType : 'json',
    const result = this.html.match(new RegExp(`${key} ?: ?'(.*?)'`))
    if (result) {
      this.out[key] = result[1]
    }
    return this
  }

  matchIframe(key = 'iframe') {
    // <iframe class="ifr2" name="1604572455" src="/fn?A2VTOQ5gD2kHYQVjVjdUbABqBDEFfAN1UmhabQVvADEDN1s5XDZXMQlrB2QBYA_c_c" frameborder="0" scrolling="no"></iframe>
    return this.match(key, '<iframe.*src="(\\/fn\\?\\w{5,})" ')
  }

  private match(key: string, pattern: string) {
    const result = this.html.match(new RegExp(pattern))
    if (result) {
      this.out[key] = result[1]
    }
    return this
  }

  done() {
    return this.out
  }
}
