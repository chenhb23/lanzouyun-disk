import {EventEmitter} from 'events'
import path from 'path'
import {autorun, makeObservable, observable} from 'mobx'
import {persist} from 'mobx-persist'
import type Request from 'got/dist/source/core'
import type {Progress} from 'got/dist/source/core'
import throttle from 'lodash.throttle'

import Task, {TaskStatus} from './AbstractTask'
import {byteToSize, sizeToByte} from '../../common/util'
import {config} from './Config'
import {message, Modal} from 'antd'
import {calculate} from './Calculate'
import {pipeline} from 'stream/promises'
import {UploadSubtask, UploadTask} from './task/UploadTask'
import {finish} from './Finish'
import * as stream from 'stream'

export interface Upload {
  on(event: 'finish', listener: (info: UploadTask) => void): this
  on(event: 'finish-task', listener: (info: UploadTask, task: UploadSubtask) => void): this
  // on(event: 'error', listener: (msg: string) => void): this

  // todo: 使用 off?
  removeListener(event: 'finish', listener: (info: UploadTask) => void): this
  removeListener(event: 'finish-task', listener: (info: UploadTask, task: UploadSubtask) => void): this
  // removeListener(event: 'error', listener: (msg: string) => void): this

  emit(event: 'finish', info: UploadTask)
  emit(event: 'finish-task', info: UploadTask, task: UploadSubtask)
  // emit(event: 'error', msg: string)
}

/**
 * 说明
 * 文件尽量放到文件夹压缩后再上传！
 * 上传速度： todo
 * */

export class Upload extends EventEmitter implements Task<UploadTask> {
  handler: ReturnType<typeof autorun>
  taskSignal: {[resolvePathName: string]: AbortController} = {}

  @persist('list') list: UploadTask[] = []

  private taskSignalId(task: Pick<UploadSubtask, 'sourceFile'>) {
    return path.join(task.sourceFile.path, task.sourceFile.name)
  }

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
    this.on('finish', info => {
      this.remove(info.file.path)
      finish.uploadList.push(info)
    })
    this.on('finish-task', async task => {
      // delete this.taskSignal[path.resolve(info.file.path, task.name)]
      if (task.tasks.every(item => item.status === TaskStatus.finish)) {
        await task.finishTask()
        this.emit('finish', task)
      } else {
        this.start(task.file.path)
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

  checkTask() {
    const task = this.list.find(value => value.status === TaskStatus.ready)
    if (task) {
      this.start(task.file.path)
    }
  }

  stopQueue() {
    this.handler?.()
    this.handler = null
  }

  getList(filter: (item: UploadSubtask) => boolean) {
    return this.list
      .map(item => item.tasks)
      .flat()
      .filter(filter)
  }

  private checkWarningSize() {
    return new Promise<void>((resolve, reject) => {
      const recordSize = calculate.getRecordSize()
      if (config.uploadWarningEnabled && recordSize >= sizeToByte(`${config.uploadWarningSize}g`)) {
        Modal.confirm({
          content: `当天上传总流量（${byteToSize(recordSize)}）已超过警戒线（${
            config.uploadWarningSize
          }G），是否继续上传？`,
          okText: '上传',
          onOk: () => resolve(),
          onCancel: () => reject('上传流量超过警戒线，已选择取消'),
        })
      } else {
        resolve()
      }
    })
  }

  async addTasks(tasks: UploadTask[]) {
    await this.checkWarningSize()
    try {
      for (const task of tasks) {
        await this.addTask(task)
      }
    } catch (e: any) {
      message.error(e.message)
      throw e
    }
  }

  // 上传文件（夹）任务
  async addTask(task: UploadTask) {
    await task.beforeAddTask()
    this.list.push(task)
  }

  pause(path: string) {
    const task = this.list.find(item => item.file.path === path)
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
    this.list.forEach(item => this.pause(item.file.path))
  }

  private abortTask = (subTask: UploadSubtask) => {
    const id = this.taskSignalId(subTask)
    if (this.taskSignal[id]) {
      this.taskSignal[id].abort('用户取消上传')
      delete this.taskSignal[id] // todo
    }
  }

  remove(path: string) {
    const task = this.list.find(item => item.file.path === path)
    if (task) {
      task.tasks.forEach(this.abortTask)
      this.list = this.list.filter(item => item.file.path !== path)
    }
  }

  removeAll() {
    this.list.forEach(info => this.remove(info.file.path))
    // this.list = []
  }

  async start(path: string, reset = false) {
    const task = this.list.find(item => item.file.path === path)
    if (!task) return
    if (reset && task.tasks?.length) {
      task.tasks.forEach(task => {
        if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) {
          task.status = TaskStatus.ready
        }
      })
    }

    if (!this.canStart()) return

    if (!task.tasks?.length) {
      await task.initTask()
    }

    if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) return

    const taskIndex = task.tasks.findIndex(item => TaskStatus.ready === item.status)
    if (taskIndex === -1) return
    const subtask = task.tasks[taskIndex]

    subtask.status = TaskStatus.pending
    const signalId = this.taskSignalId(subtask)
    // const form = createUploadForm(subtask, taskIndex)

    const abort = new AbortController()
    // const encoder = new FormDataEncoder(form)
    // const stream = http.request.stream.post('fileup.php', {headers: encoder.headers})
    try {
      const {from, to} = task.getStream(subtask)

      const uid = `${Date.now()}${Math.floor(Math.random() * 100)}`
      const onProgress = throttle((progress: Progress) => {
        calculate.setRecord(uid, progress.transferred)
        subtask.resolve = progress.transferred
      }, 1000)
      to.on('uploadProgress', onProgress)

      this.taskSignal[signalId] = abort

      const ref = collectStream(to)
      // 需要 new stream.PassThrough() 才不会错过时点
      await pipeline(from, to, new stream.PassThrough(), {signal: abort.signal})
      if (ref.current?.zt === 0) {
        subtask.status = TaskStatus.fail
        throw new Error(`文件名：${subtask.name}；接口返回：${ref.current.info}`)
      }

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

  canStart() {
    return this.queue < config.uploadMax
  }

  startAll() {
    this.list.forEach(info => {
      info.tasks.forEach(task => {
        if (task.status === TaskStatus.pause) {
          task.status = TaskStatus.ready
        }
      })

      this.start(info.file.path)
    })
  }
}

function collectStream(st: Request) {
  const ref: {current: Html5upRes} = {current: null}
  let str = ''
  st.on('data', chunk => (str += chunk.toString()))
  st.on('end', () => {
    try {
      ref.current = JSON.parse(str)
    } catch (e) {
      console.log('collectStream error: ', str)
    }
  })

  return ref
}
