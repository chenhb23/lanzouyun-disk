import fs from 'fs-extra'
import {UploadTask} from './UploadTask'

export class UploadLinkTask extends UploadTask {
  async beforeAddTask(): Promise<void> {
    const filePath = this.file.path
    const stat = await fs.stat(filePath)
    const isFile = stat.isFile()
    const isDirectory = stat.isDirectory()
    if (isFile || isDirectory) {
      if (isDirectory) {
        const files = await fs.readdir(filePath)
        if (!files.length) {
          throw new Error('空文件夹')
        }
      }
    } else {
      throw new Error(`格式不支持: ${this.file.name}`)
    }
  }
}
