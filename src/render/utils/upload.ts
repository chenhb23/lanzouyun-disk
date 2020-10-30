import * as fs from 'fs'
import * as http from 'https'
import FormData from 'form-data'

async function upload({filePath = '/Users/chb/Downloads/webstorm/WebStorm-2020.2.2.dmg.ab.dmg'}) {
  let bytes = 0

  const fstat = fs.statSync(filePath)
  const size = fstat.size

  const fr = fs.createReadStream(filePath, {
    // highWaterMark: 0 // 限速
    start: 0,
    end: size / 2,
  })
  fr.on('data', chunk => {
    bytes += chunk.length
    console.log('progress:', bytes, size, Math.floor(bytes / size * 100))
  })

  const form = new FormData()
  form.append('task', '1')
  form.append('ve', '2')
  form.append('id', 'WU_FILE_0')
  form.append('name', 'WebStorm-2020.2.2.dmg.ad.dmg')
  form.append('type', 'application/octet-stream')
  form.append('lastModifiedDate', new Date().toString())
  // form.append('size', 74855921)
  form.append('size', size)
  form.append('folder_id_bb_n', 2498513)
  form.append('upload_file', fr, 'WebStorm-2020.2.2.dmg.ad.dmg')

  const headers = form.getHeaders()
  Object.assign(headers, {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    // "content-type": "multipart/form-data; boundary=----WebKitFormBoundary6OAWH5izlxhWpKUq",
    "pragma": "no-cache",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": "UM_distinctid=1756d3ce75421-098f088995e7d2-32677007-4da900-1756d3ce755c43; CNZZDATA1253610888=1014044303-1603850658-%7C1603850658; phpdisk_info=BzICN1Y0AjwHNQ5oAGkEV1I2Bg0NZVY5AjlTMldmVmwEM1dmDGoBP1NoUwpdM1FoVzdQZVwzBjQGMVA3V2lUMgdgAjlWMwJvBzEObgBjBDhSNQY2DWxWMAI3UzRXN1Y3BGFXZgxpAW5TaVNmXQ5ROlc%2FUGpcNAZmBj1QM1diVGIHMQI5; ylogin=1702063; PHPSESSID=i7cj738mur1vtsa2gbdrla9curioujrm; CNZZDATA1253610886=1822033588-1603856267-https%253A%252F%252Fup.woozooo.com%252F%7C1603955871; folder_id_c=2498513"
  })

  const req = http.request({
    method: 'post',
    path: '/fileup.php',
    host: 'up.woozooo.com',
    headers: headers,
  }, res => {
    let data = ''
    res.setEncoding('utf8')
    res.on("data", d => (data += d))
    res.on("end", () => {
      console.log(data)
      // todo: Promise.resolve()
    })
  })

  form.pipe(req)
    .on("finish", () => req.end())
    .on("abort", () => req.abort())
    .on("error", () => req.abort())
    .on("close", () => req.abort())
}

export default upload
