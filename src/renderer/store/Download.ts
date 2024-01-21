import {EventEmitter} from 'events'
import {autorun, makeObservable, observable} from 'mobx'
import {persist} from 'mobx-persist'
import path from 'path'
import Task, {TaskStatus} from './AbstractTask'
import {delay, isSpecificFile, restoreFileName} from '../../common/util'

import fs from 'fs-extra'
import {Progress} from 'got/dist/source/core'
import {pipeline} from 'stream/promises'
import throttle from 'lodash.throttle'
import {message} from 'antd'
import {config} from './Config'
import {getDownloadDir} from '../page/Setting'
import {DownloadSubTask, DownloadTask} from './task/DownloadTask'
import {finish} from './Finish'

// 分享链接的下载全部没有 name
// type AddTask = {
//   url: string
//   name?: string // 分享链接的下载全部没有 name
//   dir?: string // 指定下载目录
//   pwd?: string
//   merge?: boolean
// }

export interface Download {
  on(event: 'finish', listener: (info: DownloadTask) => void): this
  on(event: 'finish-task', listener: (info: DownloadTask, task: DownloadSubTask) => void): this
  // on(event: 'error', listener: (msg: string) => void): this

  removeListener(event: 'finish', listener: (info: DownloadTask) => void): this
  removeListener(event: 'finish-task', listener: (info: DownloadTask, task: DownloadSubTask) => void): this
  // removeListener(event: 'error', listener: (msg: string) => void): this

  emit(event: 'finish', info: DownloadTask)
  emit(event: 'finish-task', info: DownloadTask, task: DownloadSubTask)
  // emit(event: 'error', msg: string)
}

export class Download extends EventEmitter implements Task<DownloadTask> {
  handler: ReturnType<typeof autorun>
  taskSignal: {[taskUrl: string]: AbortController} = {}
  @persist('list') list: DownloadTask[] = []

  get queue() {
    return this.getList(item => item.status === TaskStatus.pending).length
  }

  constructor() {
    super()
    makeObservable(this, {
      list: observable,
    })

    process.nextTick(this.init)
  }

  private init = () => {
    this.startQueue()
    this.on('finish', async info => {
      // await delay(200)
      // await info.finishTask()
      // await this.onTaskFinish(info)
      this.remove(info.url)
      finish.downloadList.push(info)
    })
    this.on('finish-task', async (task, subTask) => {
      if (task.tasks.every(item => item.status === TaskStatus.finish)) {
        await delay(200)
        await task.finishTask()

        this.emit('finish', task)
      } else {
        this.start(task.url)
      }
    })
  }

  startQueue() {
    this.handler = autorun(
      () => {
        this.list.length && this.checkTask()
      },
      {delay: 300}
    )
  }

  // todo: delete
  stopQueue() {
    this.handler?.()
    this.handler = null
  }

  checkTask() {
    // const task = this.list.find(item => [TaskStatus.ready, TaskStatus.pending].includes(item.status))
    const task = this.list.find(item => TaskStatus.ready === item.status)
    if (task) {
      this.start(task.url)
    }
  }

  getList(filter: (item: DownloadSubTask) => boolean) {
    return this.list
      .map(item => item.tasks)
      .flat()
      .filter(filter)
  }

  canStart(task: DownloadTask) {
    return this.queue < config.downloadMax // && info.status !== InitStatus.pending
  }

  abortTask = (subTask: DownloadSubTask) => {
    if (this.taskSignal[subTask.url]) {
      this.taskSignal[subTask.url].abort()
      delete this.taskSignal[subTask.url] // todo:
    }
  }

  pause(url: string) {
    const task = this.list.find(value => value.url === url)
    if (task) {
      task.tasks.forEach(subTask => {
        switch (subTask.status) {
          case TaskStatus.ready:
            subTask.status = TaskStatus.pause
            break
          case TaskStatus.pending:
            this.abortTask(subTask)
            break
        }
      })
    }
  }

  pauseAll() {
    this.list.forEach(item => this.pause(item.url))
  }

  remove(url: string) {
    const task = this.list.find(item => item.url === url)
    if (task) {
      task.tasks.forEach(this.abortTask)
      this.list = this.list.filter(item => item.url !== url)
    }
  }

  removeAll() {
    this.list.forEach(info => this.remove(info.url))
    // this.list = []
  }

  /**
   *
   * 如果要从 reset 暂停恢复到下载状态，传 true
   */
  async start(url: string, reset = false) {
    const task = this.list.find(value => value.url === url)
    if (!task) return
    if (reset && task.tasks?.length) {
      task.tasks.forEach(value => {
        if ([TaskStatus.pause, TaskStatus.fail].includes(value.status)) {
          value.status = TaskStatus.ready
        }
      })
    }

    if (!this.canStart(task)) return

    if (!task.tasks?.length) {
      await task.initTask()
      if (!task.tasks?.length) {
        message.error(`${task.name ?? task.url} 初始化失败，已移除任务`)
        // 删除任务
        this.remove(url)
        return
      }
    }

    const subtask = task.tasks.find(value => value.status === TaskStatus.ready)
    if (!subtask) return

    subtask.status = TaskStatus.pending
    const abort = new AbortController()
    const signalId = subtask.url

    try {
      await fs.ensureDir(subtask.dir)

      const {from: stream, to} = await task.getStream(subtask)

      const headers = stream.response.headers
      if (headers['content-disposition']) {
        // 将精确的 content-length 覆盖原 subTask 的 size
        subtask.size = Number(headers['content-length'])
      }
      const onProgress = throttle((progress: Progress) => {
        subtask.resolve = progress.transferred
      }, 1000)
      stream.on('downloadProgress', onProgress)

      this.taskSignal[signalId] = abort

      // 流下载
      await pipeline(stream, to, {signal: abort.signal})

      subtask.status = TaskStatus.finish
      this.emit('finish-task', task, subtask)
    } catch (e: any) {
      console.error(e)
      if (abort.signal.aborted) {
        subtask.status = TaskStatus.pause
      } else {
        subtask.status = TaskStatus.fail
        const msg = typeof e === 'string' ? e : typeof e === 'object' && 'message' in e ? e.message : '未知错误'
        message.error(msg)
      }
    } finally {
      delete this.taskSignal[signalId]
    }
  }

  startAll() {
    this.list.forEach(info => {
      info.tasks.forEach(task => {
        if (task.status === TaskStatus.pause) {
          task.status = TaskStatus.ready
        }
      })

      this.start(info.url)
    })
  }

  /**
   * ### 批量添加任务
   * - 返回添加成功的数量
   * - 询问下载地址
   */
  async addTasks(tasks: DownloadTask[]) {
    const dir = await getDownloadDir()
    let success = 0
    for (const task of tasks) {
      task.dir = dir
      await this.addTask(task)
        .then(() => ++success)
        .catch(console.error)
    }
    return success
  }

  /**
   * ### 单个下载
   * - 先不解析，开始下载时再解析
   * - 不询问下载地址
   */
  async addTask(tasks: DownloadTask) {
    await tasks.beforeAddTask()
    this.list.push(tasks)
  }
}
