const fs = require('fs')
const http = require('https')
const querystring = require('querystring')
const FormData = require('form-data')
const util = require('util')

const stat = util.promisify(fs.stat)

global.fs = fs
global.http = http
global.FormData = FormData

const test2 = () => {
  const req = http.request({
    method: 'post',
    path: '/doupload.php',
    host: 'up.woozooo.com',
    headers: {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "zh-CN,zh;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "Cookie": "UM_distinctid=1756d3ce75421-098f088995e7d2-32677007-4da900-1756d3ce755c43; CNZZDATA1253610888=1014044303-1603850658-%7C1603850658; phpdisk_info=BzICN1Y0AjwHNQ5oAGkEV1I2Bg0NZVY5AjlTMldmVmwEM1dmDGoBP1NoUwpdM1FoVzdQZVwzBjQGMVA3V2lUMgdgAjlWMwJvBzEObgBjBDhSNQY2DWxWMAI3UzRXN1Y3BGFXZgxpAW5TaVNmXQ5ROlc%2FUGpcNAZmBj1QM1diVGIHMQI5; ylogin=1702063; PHPSESSID=i7cj738mur1vtsa2gbdrla9curioujrm; folder_id_c=-1; CNZZDATA1253610886=1822033588-1603856267-https%253A%252F%252Fup.woozooo.com%252F%7C1603950456",
    }
  }, res => {
    res.setEncoding('utf8')
    let data = ''
    res.on("data", d => (data += d))
    res.on("end", () => {
      console.log(data)
    })
  })

  req.write(querystring.stringify({
    task: '47',
    folder_id: -1
  }))

  req.end()
}

// upload()
