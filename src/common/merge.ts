import fs from 'fs-extra'
import {pipeline} from 'stream/promises'

async function merge(files: string[], target: string) {
  for (const [index, file] of files.entries()) {
    await pipeline(
      // pipeline 会自动释放文件的引用
      fs.createReadStream(file),
      fs.createWriteStream(target, {flags: index === 0 ? 'w' : 'a'})
    )
  }
}

export default merge
