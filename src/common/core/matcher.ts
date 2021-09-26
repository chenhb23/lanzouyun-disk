import cheerio from 'cheerio'

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

  // 获取对象属性的变量值
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

  // 获取对象属性的值
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
  matchPwdFile(key: string) {
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
    const src = cheerio.load(this.html)('iframe').attr().src
    if (src) {
      this.out[key] = src
    }
    return this
  }

  matchSign() {
    const result = this.html.match(new RegExp(`'sign':(.*?),`))
    if (result) {
      const signKey = result[1]
      const postdown = this.html.match(new RegExp(`var ${signKey} = '(.*?)';`))
      if (postdown) {
        this.out.sign = postdown[1]
      }
    }
    return this
  }

  matchPdownload() {
    const result = this.html.match(new RegExp(`var pdownload = '(.*?)';`))
    if (result) {
      this.out.pdownload = result[1]
    }
    return this
  }

  matchWebsign() {
    // const result = this.html.match(new RegExp(`'websignkey':'(.*?)'`))
    const result = this.html.match(new RegExp(`'websign':'(.*?)',`))
    if (result) {
      this.out.websign = result[1]
    }
    return this
  }

  matchWebsignkey() {
    const result = this.html.match(new RegExp(`'websignkey':'(.*?)'`))
    if (result) {
      this.out.websignkey = result[1]
    }
    return this
  }

  matchVes() {
    const result = this.html.match(new RegExp(`'ves':(.*?),`))
    if (result) {
      this.out.ves = result[1]
    }
    return this
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
