import requireModule from "./requireModule";

const http = requireModule('https')
const FormData = requireModule('form-data')

/**
 * 自动获取 cookie
 */
function request() {
  return new Promise((resolve, reject) => {
    // todo: 自己传入 formdata
    const req = http.request({
      method: 'get',
      path: '/',
      host: 'www.baidu.com',
    }, res => {
      let data = ''
      res.setEncoding('utf8')
      res.on("data", chunk => (data += chunk))
      res.on("end", () => {
        console.log(data)
        resolve(data)
      })
      res.on("error", reject)
    })

    // req.write()
    req.end()
  })
}

export default request
