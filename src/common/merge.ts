import fs from 'fs-extra'
import {pipeline} from 'stream/promises'
import {SplitTaskFile} from './split'
import path from 'path'

export async function merge(files: string[], target: string) {
  for (const [index, file] of files.entries()) {
    await pipeline(
      // pipeline 会自动释放文件的引用
      fs.createReadStream(file),
      fs.createWriteStream(target, {flags: index === 0 ? 'w' : 'a'})
    )
  }
}

export async function split(tasks: SplitTaskFile[], dir: string) {
  await fs.ensureDir(dir)
  for (const task of tasks) {
    const fr = task.endByte
      ? fs.createReadStream(task.sourceFile.path, {start: task.startByte, end: task.endByte})
      : fs.createReadStream(task.sourceFile.path)

    await pipeline(
      //
      fr,
      fs.createWriteStream(path.join(dir, task.name))
    )
  }
}
