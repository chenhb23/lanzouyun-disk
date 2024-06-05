import {TaskStatus} from '../AbstractTask'
import {lsShare, URLType} from '../../../common/core/ls'
import {makeObservable, observable} from 'mobx'
import {BaseTask} from './BaseTask'
import {
  delay,
  fixFileName,
  isFile,
  isSpecificFile,
  restoreFileName,
  sizeToByte,
  streamToText,
} from '../../../common/util'
import path from 'path'
import {fileDownUrl, pwdFileDownUrl} from '../../../common/core/download'
import {Request} from 'got'
import * as http from '../../../common/http'
import {Matcher} from '../../../common/core/matcher'
import fs from 'fs-extra'
import {merge} from '../../../common/merge'
import electronApi from '../../electronApi'

export interface DownloadSubTask {
  url: string
  pwd?: string
  dir: string // 临时地址
  name: string // 真实名称
  resolve: number
  status: TaskStatus
  size: number
}

/**
 * 1. 文件：获取 url
 * 2. 文件夹：
 */
export class DownloadTask implements BaseTask {
  // id = url
  // uid: string
  // 分享链接
  url: string
  // 任务类型，文件 | 文件夹 (初始化 task 的时候赋值)
  urlType: URLType
  // 文件名（真实名称，可稍后初始化）
  name: string
  // 文件下载保存的地址（真实地址）
  dir: string
  // 分享链接的密码
  pwd?: string
  // 自定合并 tasks 的文件。如果需要合并，则会创建 文件名+.download 的临时文件夹
  merge?: boolean

  tasks: DownloadSubTask[] = []

  constructor(props: Partial<DownloadTask> = {}) {
    // makeAutoObservable(this)
    makeObservable(this, {
      url: observable,
      urlType: observable,
      name: observable,
      dir: observable,
      pwd: observable,
      merge: observable,
      tasks: observable,
    })
    // Object.assign(this, {uid: `${Date.now()}`}, props)
    Object.assign(this, props)
    if (props.name) {
      this.name = fixFileName(props.name)
    }
  }

  get total() {
    return this.tasks.reduce((total, item) => total + item.size, 0)
  }

  get resolve() {
    return this.tasks.reduce((total, item) => total + item.resolve, 0)
  }

  // 下载状态
  get status() {
    if (this.tasks.some(item => item.status === TaskStatus.fail)) return TaskStatus.fail
    if (this.tasks.some(item => item.status === TaskStatus.pause)) return TaskStatus.pause
    if (this.tasks.some(item => item.status === TaskStatus.pending)) return TaskStatus.pending
    if (this.tasks.length && this.tasks.every(item => item.status === TaskStatus.finish)) return TaskStatus.finish
    return TaskStatus.ready
  }

  async beforeAddTask() {
    // todo: 检查是否在下载列表

    if (this.name) {
      // todo: 下载时也要检查文件是否存在
      const name = restoreFileName(path.join(this.dir, this.name))
      if (fs.existsSync(name)) {
        const result = confirm(`"${this.name}"已存在，是否删除并重新下载？`)
        if (!result) {
          throw new Error('取消重新下载')
        }

        await electronApi.trashItem(name)
      }
    }
  }

  async initTask() {
    if (this.tasks?.length) return
    const {name, type, list} = await lsShare({url: this.url, pwd: this.pwd})
    if (!list?.length) return

    this.urlType = type
    if (!this.name) {
      this.name = name
    }
    if (this.urlType === URLType.file && isSpecificFile(name)) {
      this.name = restoreFileName(this.name)
    }
    if (this.merge === undefined && this.urlType === URLType.folder && isFile(this.name)) {
      this.merge = true
    }

    const dir = path.join(this.dir, this.name) + '.downloading'
    this.tasks = list.map(value => {
      // 多选下载，也需要还原列表文件的名称
      const name = !this.merge && isSpecificFile(value.name) ? restoreFileName(value.name) : value.name

      return {
        url: value.url,
        pwd: value.pwd,
        dir,
        name: name,
        size: sizeToByte(value.size),
        resolve: 0,
        status: TaskStatus.ready,
      }
    })
  }

  async getStream(subtask: DownloadSubTask) {
    const {url: downloadUrl} = subtask.pwd
      ? await pwdFileDownUrl(subtask.url, subtask.pwd)
      : await fileDownUrl(subtask.url)
    return {
      from: await createDownloadStream(downloadUrl),
      to: fs.createWriteStream(path.join(subtask.dir, subtask.name)),
    }
  }

  async finishTask() {
    // 目录中有同名文件夹才会报错
    const resolveTarget = path.join(this.dir, this.name)
    const subTask = this.tasks[0]
    switch (this.urlType) {
      case URLType.file:
        await fs.rename(path.join(subTask.dir, subTask.name), resolveTarget)
        await fs.remove(subTask.dir)
        break
      case URLType.folder:
        if (this.merge) {
          // todo: 新增 合并中 状态
          // 读取目录下文件（会自动排序）
          const files = (await fs.readdir(subTask.dir)).map(name => path.join(subTask.dir, name))
          // 合并后删除
          await merge(files, resolveTarget)
          await delay(200)
          await fs.remove(subTask.dir)
        } else {
          // 重命名
          await fs.rename(subTask.dir, subTask.dir.replace(/\.downloading$/, ''))
        }
        break
    }
  }
}

export function createDownloadStream(downloadUrl: string) {
  return new Promise<Request>((resolve, reject) => {
    const stream = http.share.stream(downloadUrl)
    stream
      .once('response', async (response: typeof stream.response) => {
        // 下载环境异常会跳转到验证页面
        if (response.headers['content-type'] === 'text/html') {
          // 解析下载验证页面
          const html = await streamToText(stream)
          const ajaxData = await Matcher.parseValidateAjax(html)
          if (ajaxData) {
            await delay(2000) // important! 模拟验证页面的延时，去掉会导致验证失败！
            const {url} = await http
              .share(new URL(ajaxData.url, downloadUrl), {
                method: ajaxData.type,
                headers: {referer: downloadUrl},
                form: ajaxData.data,
              })
              .json<{url: string}>()
            resolve(createDownloadStream(url))
          } else {
            const errorMsg = Matcher.parseErrorPage(html)
            reject(errorMsg || '解析出错')
          }
        } else {
          resolve(stream)
        }
      })
      .once('error', err => {
        reject(err.message)
      })
  })
}
