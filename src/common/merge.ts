import {PathLike, WriteStream} from 'fs'
import requireModule from '../main/requireModule'

const fs = requireModule('fs')

function write(filePath: PathLike, target: WriteStream) {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(filePath)
    rs.pipe(target, {end: false}).on('error', reject)
    rs.on('end', resolve).on('error', reject)
  })
}

async function merge(files: PathLike[], target: PathLike) {
  const ws = fs.createWriteStream(target, {flags: 'w'})
  for (const file of files) {
    console.log('write file: ', file)
    await write(file, ws)
  }
  return true
}

export default merge
