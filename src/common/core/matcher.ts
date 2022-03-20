import cheerio from 'cheerio'

/**
 * 获取页面各种元素
 */
export class Matcher {
  static matchIframe(html: string) {
    return cheerio.load(html)('iframe').attr()?.src
  }

  /**
   * 文件夹：无密码/带密码
   * @return object 返回值不包含 pwd
   */
  static parseFolderAjax(html: string) {
    const script = html.match(/<script type="text\/javascript">([\s\S]+?)<\/script>/)[1]
    const variable = script.match(/([\s\S]+?)(function )?file\(\)/)?.[1].replace(/document\..+?;/g, '')

    const params = script.replace(/function more\(\){[\s\S]+}/, '').match(/\$\.ajax\(({[\s\S]+})\);/)?.[1]

    return eval(`${variable}(${params})`)
  }

  // 文件：无密码
  static parseAjax(html: string) {
    const script = html.match(/<script type="text\/javascript">([\s\S]+?)<\/script>/)[1]
    const variable = script.match(/([\s\S]+)\$\.ajax/)[1]
    const params = script.match(/\$\.ajax\(([\s\S]+)\)/)[1]
    return eval(`${variable}(${params})`)
  }

  // 文件：带密码
  static parsePwdAjax(html: string, password = '') {
    const script = html.match(/<script type="text\/javascript">([\s\S]+?)<\/script>/)[1]
    const params = script.match(/\$\.ajax\(({[\s\S]+?})\);/)?.[1]
    return eval(`var pwd = "${password}";(${params})`)
  }
}
