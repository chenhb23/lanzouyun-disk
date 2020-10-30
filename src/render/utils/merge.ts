import * as fs from 'fs'

function write(filePath, target) {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(filePath)
    rs.pipe(target, {end: false}).on("error", reject)
    rs.on("end", resolve).on("error", reject)
  })
}

async function merge(files, target) {
  const ws = fs.createWriteStream(target, {flags: 'w'})
  for (const file of files) {
    await write(file, ws)
  }
  return true
}

export default merge
