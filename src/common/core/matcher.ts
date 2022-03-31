import cheerio from 'cheerio'
import prettier from 'prettier/standalone'
import parserBabel from 'prettier/parser-babel'
import * as queryString from 'querystring'

interface AjaxData {
  type: string
  url: string
  data: any
}

/**
 * 获取页面各种元素
 */
export class Matcher {
  static matchIframe(html: string) {
    return cheerio.load(html)('iframe').attr()?.src
  }

  /**
   * 规范化获取 script
   */
  private static formatScript(html: string) {
    const scripts = cheerio.load(html)('html script:not([src])')
    const script = scripts.eq(0).html()
    if (!script) throw new Error('script 获取失败')

    return prettier.format(script, {
      plugins: [parserBabel],
      parser: 'babel',
      semi: true, // 加上分号
      trailingComma: 'none', // 不加尾逗号
      singleQuote: false, // 使用双冒号
      printWidth: 1000, // 为了让代码尽量不换行
    })
  }

  /**
   * script -> ajaxData
   */
  private static parseAjaxData(
    html: string,
    getVariable: (script: string) => string,
    getData: (script: string) => string
  ): AjaxData {
    const script = this.formatScript(html)

    const variable = getVariable(script)
    const data = getData(script)
    const body = eval(`${variable}(${data})`)

    if (typeof body.data === 'string') {
      body.data = queryString.parse(body.data)
    }
    return body
  }

  /**
   * 文件夹：无密码/带密码
   * @return object 返回值不包含 pwd
   */
  static parseFolderAjax(html: string) {
    return this.parseAjaxData(
      html,
      script => script.match(/([\s\S]+?)(function )?file\(\)/)?.[1].replace(/document\..+?;/g, ''),
      script => script.replace(/function more\(\) {[\s\S]+}/, '').match(/\$\.ajax\(({[\s\S]+})\);/)?.[1]
    )
  }

  /**
   * 文件：无密码
   *
   * data 为 object 类型
   */
  static parseAjax(html: string) {
    return this.parseAjaxData(
      html,
      script => script.match(/([\s\S]+)\$\.ajax/)[1],
      script => script.match(/\$\.ajax\(([\s\S]+)\)/)[1]
    )
  }

  /**
   * 文件：带密码
   *
   * data 由 string 转为 object 类型
   */
  static parsePwdAjax(html: string, password = '') {
    return this.parseAjaxData(
      html,
      _ => `var pwd = "${password}";`,
      script => script.match(/\$\.ajax\(({[\s\S]+?})\);/)?.[1]
    )
  }
}
