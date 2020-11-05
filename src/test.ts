import {EventEmitter} from 'events'
import mobx, {makeObservable, AnnotationMapEntry, autorun, observable, when, toJS} from 'mobx'

export const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

function parseUrl(url: string) {
  const parse = new URL(url)
  return {
    is_newd: parse.origin,
    f_id: parse.pathname.replace(/^\//, ''),
  }
}

enum InitStatus {
  notInit,
  pending,
  finish,
}

enum TaskStatus {
  ready,
  pending,
  finish,
  fail,
}

interface AddTask {
  url: string // 这个作为 id
  name: string // 如果是解析 url，应该传入 name, 否则 name_all
  pwd?: string
  merge?: boolean
}

interface DownloadTaskInfo {
  url: string // 这个作为 id
  name: string // 如果是解析 url，应该传入 name, 否则 name_all
  pwd?: string
  merge?: boolean // default: false, if true, folderPath + name
  // 以下是生成的
  folderPath: string // 使用用户选择的路径
  initStatus: InitStatus
  subTask: DownloadTask[]
}

interface DownloadTask {
  // readonly is_newd: string
  // readonly f_id: string

  url: string // 作为 id
  name: string
  resolve: number
  status: TaskStatus
  pwd?: string
  folderPath: string // 下载路径
}

// interface Task {
//   taskId: string
//   initial: InitStatus
//   failMsg?: string
//   name: string
//   status: TaskStatus
//   subTask?: any[]
// }
// interface SubTask {
//   status: TaskStatus
// }

export interface DownloadMng {
  on(event: 'finish', listener: (info: DownloadTaskInfo) => void): this
  on(event: 'finish-task', listener: (info: DownloadTaskInfo, taskIndex: number) => void): this
  on(event: 'error', listener: (info: DownloadTaskInfo, taskIndex: number) => void): this

  removeListener(event: 'finish', listener: (info: DownloadTaskInfo) => void): this
  removeListener(event: 'finish-task', listener: (info: DownloadTaskInfo, taskIndex: number) => void): this
  removeListener(event: 'error', listener: (info: DownloadTaskInfo, taskIndex: number) => void): this

  emit(event: 'finish', info: DownloadTaskInfo)
  emit(event: 'finish-task', info: DownloadTaskInfo, taskIndex: number)
  emit(event: 'error', info: DownloadTaskInfo, taskIndex: number)
}

console.warn = function () {}

export class DownloadMng extends EventEmitter {
  list: DownloadTaskInfo[] = []

  constructor() {
    super()
    makeObservable(this, {
      list: true,
    })

    /**
     * 因为 EventEmitter
     * 无法立即从构造函数中发出事件，脚本也不会处理用户为该事件分配的回调
     * 使用 process.nextTick 设置回调，在构造函数完成后发出事件
     */
    process.nextTick(this.init)
  }

  private init = () => {
    this.startQueue()
    this.on('finish', info => {
      this.remove(info.url)
    })
    this.on('finish-task', info => {
      if (info.subTask.every(item => item.status === TaskStatus.finish)) {
        this.emit('finish', info)
      } else {
        this.start(info.url)
      }
    })
  }

  handler: ReturnType<typeof autorun>
  startQueue() {
    /**
     * 添加任务，删除任务，任务状态改变的时候触发
     * 任务状态改变的时候，autorun 也会执行！
     */
    this.handler = autorun(
      () => {
        this.list.length && this.checkTask()
      },
      {delay: 300}
    )
  }

  stopQueue() {
    this.handler?.()
    this.handler = null
  }

  checkTask = () => {
    const url = this.list.find(item => [InitStatus.notInit].includes(item.initStatus))?.url
    if (url) {
      this.start(url).catch(() => this.remove(url))
    }
  }

  get queue() {
    return this.getList(item => item.status === TaskStatus.pending).length
  }

  get queueList() {
    return this.getList(item => [TaskStatus.ready, TaskStatus.fail].includes(item.status))
  }

  getList(fn: (item: DownloadTask) => boolean) {
    return this.list
      .map(item => item.subTask)
      .flat()
      .filter(fn)
  }

  canStart(info: DownloadTaskInfo) {
    return this.queue < 3 && info.initStatus !== InitStatus.pending
  }

  /**
   * 中途添加任务，由系统统一调度
   */
  addTask(options: AddTask) {
    const info: DownloadTaskInfo = {
      ...options,
      folderPath: '/Users/chb/Desktop/tempDownload',
      initStatus: InitStatus.notInit,
      subTask: [],
    }

    this.list.push(info)
  }

  async start(url: string) {
    const info = this.list.find(item => item.url === url)
    if (info && this.canStart(info)) {
      if (info.initStatus === InitStatus.notInit) {
        await this.genTask(info)
      }
      const taskIndex = info.subTask.findIndex(item => [TaskStatus.ready, TaskStatus.fail].includes(item.status))
      if (taskIndex >= 0) {
        info.subTask[taskIndex].status = TaskStatus.pending
        // 下载
        // 加入下载 handle
        await delay(3000)
        // 监听进度
        info.subTask[taskIndex].status = TaskStatus.finish
        this.emit('finish-task', info, taskIndex)
      }
      // this.emit('finish', task)
      // console.log('finish', task.name)
    }
  }

  async remove(url: string) {
    // console.log('remove', url)
    this.list = this.list.filter(item => item.url !== url)
    // 如果已有上传的文件（夹），同时删除文件（夹）
  }

  async removeAll() {
    // todo: stop task
    this.list = []
  }

  private async genTask(info: DownloadTaskInfo) {
    try {
      info.initStatus = InitStatus.pending
      const tempFolder = '/random'

      info.subTask.push(
        ...Array.from({length: 3}).map((_, i) => ({
          url: info.url,
          name: info.name + i,
          resolve: 0,
          status: TaskStatus.ready,
          pwd: info.pwd,
          folderPath: info.folderPath + tempFolder,
        }))
      )

      // todo: 模拟生成过程
      await delay(200)
      info.initStatus = InitStatus.finish
    } catch (e) {
      info.initStatus = InitStatus.notInit
      throw new Error(e)
    }
  }
}

export const downloadMng = new DownloadMng()
downloadMng.on('finish', data => {
  console.log('finish', data.name)
})

downloadMng.addTask({
  url: 'https://wws.lanzous.com/izTawhyzvxa',
  name: 'download(1).zip',
})
downloadMng.addTask({
  url: 'https://wws.lanzous.com/izTawhyzvxb',
  name: 'download(2).zip',
})
// setTimeout(() => {
//   e.addTask({
//     url: 'https://wws.lanzous.com/izTawhyzvxb',
//     name: 'download(2).zip',
//   })
// }, 1000)

setTimeout(() => {
  downloadMng.addTask({
    url: 'https://wws.lanzous.com/izTawhyzvxc',
    name: 'download(3).zip',
  })
}, 2000)

setTimeout(() => {
  downloadMng.addTask({
    url: 'https://wws.lanzous.com/izTawhyzvxd',
    name: 'download(4).zip',
  })
}, 3000)
