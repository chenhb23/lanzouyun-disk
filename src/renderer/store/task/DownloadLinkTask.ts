import path from 'path'
import fs from 'fs-extra'
import {TaskStatus} from '../AbstractTask'
import {DownloadSubTask, DownloadTask} from './DownloadTask'
import {share} from '../../../common/http'
import type {Request} from 'got'
import {directLinkInfo} from '../../utils/directLinkInfo'

export class DownloadLinkTask extends DownloadTask {
  async initTask() {
    if (this.tasks?.length) return

    const {size, filename} = await directLinkInfo(this.url)
    this.name = filename

    const dir = path.join(this.dir, this.name) + '.downloading'
    this.tasks = [
      {
        url: this.url,
        pwd: undefined,
        dir,
        name: filename, // 稍后设置
        // size: sizeToByte(value.size),
        size: size, // 稍后设置
        resolve: 0,
        status: TaskStatus.ready,
      },
    ]
  }

  async getStream(subtask: DownloadSubTask) {
    const stream = await createStream(subtask.url)
    if (!subtask.name || !subtask.size) {
      const headers = stream.response.headers
      const disposition = headers['content-disposition']
      subtask.size = +headers['content-length']
      subtask.name = disposition ? disposition.match(/filename=(.*)/)?.[1]?.trim() : subtask.url.split('/').pop()
    }
    return {
      from: stream,
      to: fs.createWriteStream(path.join(subtask.dir, subtask.name)),
    }
  }
}

function createStream(link: string) {
  return new Promise<Request>((resolve, reject) => {
    const stream = share.stream(link, {timeout: {connect: 5000}})
    stream.once('response', (response: typeof stream.response) => {
      const headers = response.headers
      // if (headers['content-type'] === 'application/octet-stream') {
      if (headers['content-type'] !== 'text/html') {
        resolve(stream)
      } else {
        reject('文件不是 application/octet-stream 类型')
      }
    })
    stream.once('error', error => reject(error.message))
  })
}
