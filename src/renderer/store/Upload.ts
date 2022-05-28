import {EventEmitter} from 'events'
import path from 'path'
import {autorun, makeObservable, observable} from 'mobx'
import {persist} from 'mobx-persist'
import fs from 'fs-extra'
import type {Progress} from 'got/dist/source/core'
import throttle from 'lodash.throttle'

import Task, {TaskStatus} from './AbstractTask'
import {byteToSize, sizeToByte} from '../../common/util'
import {findFolderByName} from '../../common/core/isExist'
import {mkdir} from '../../common/core/mkdir'
import {config} from './Config'
import {message, Modal} from 'antd'
import {calculate} from './Calculate'
import {pipeline} from 'stream/promises'
import {UploadFile, UploadSubtask, UploadTask} from './task/UploadTask'
import {UploadLinkTask} from './task/UploadLinkTask'

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
  // async addTask(options: {folderId: FolderId; file: UploadFile}) {
  async addTask(task: UploadTask) {
    await task.beforeAddTask()
    this.list.push(task)

    // const filePath = task.file.path
    // const stat = await fs.stat(filePath)
    // // 1. 检查文件大小
    // const isFile = stat.isFile()
    // const isDirectory = stat.isDirectory()
    // if (isFile || isDirectory) {
    //   if (stat.isFile()) {
    //     this.beforeAddTask({size: stat.size})
    //   } else if (stat.isDirectory()) {
    //     // 2. 过滤空文件夹
    //     const files = await fs.readdir(filePath)
    //     if (!files.length) {
    //       throw new Error('空文件夹')
    //     }
    //     for (const file of files) {
    //       const fullPath = path.resolve(filePath, file)
    //       const fstat = await fs.stat(fullPath)
    //       if (fstat.isFile()) {
    //         this.beforeAddTask({size: fstat.size})
    //       }
    //     }
    //   }
    //   this.list.push(task)
    // } else {
    //   console.log(`格式不支持: ${task.file.name}`)
    // }

    /*const filePath = task.file.path
    const stat = await fs.stat(filePath)
    if (stat.isFile()) {
      this.addFileTask(task)
    } else if (stat.isDirectory()) {
      const files = await fs.readdir(filePath)
      if (!files.length) throw new Error('空文件夹')

      let subFolderId = await findFolderByName(task.folderId, task.file.name).then(value => value?.fol_id)
      if (!subFolderId) {
        subFolderId = await mkdir({parentId: task.folderId, name: task.file.name})
      }
      for (const file of files) {
        const fullPath = path.resolve(filePath, file)
        const fstat = await fs.stat(fullPath)
        if (fstat.isFile()) {
          this.addFileTask({
            folderId: subFolderId,
            file: {size: fstat.size, name: file, type: '', path: fullPath, lastModified: fstat.mtime.getTime()},
          })
        }
      }
    } else {
      console.log(`格式不支持: ${task.file.name}`)
    }*/
  }

  // 校验上传文件
  // private beforeAddTask(file: Pick<UploadFile, 'size'>) {
  //   if (file.size > sizeToByte(config.maxSize)) {
  //     throw new Error(`文件大小(${byteToSize(file.size)}) 超出限制，最大允许上传 ${config.maxSize}`)
  //   }
  // }

  // private addFileTask(options: {folderId: FolderId; file: UploadFile}) {
  //   try {
  //     this.beforeAddTask(options.file)
  //
  //     const file: UploadFile = {
  //       size: options.file.size,
  //       name: options.file.name,
  //       type: options.file.type,
  //       path: options.file.path,
  //       lastModified: options.file.lastModified,
  //     }
  //     const task = new UploadSyncTask({file, folderId: options.folderId})
  //
  //     this.list.push(task)
  //   } catch (e: any) {
  //     message.error(e.message)
  //   }
  // }

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
      const {from, to: stream} = task.getStream(subtask)

      const uid = `${Date.now()}${Math.floor(Math.random() * 100)}`
      const onProgress = throttle((progress: Progress) => {
        calculate.setRecord(uid, progress.transferred)
        subtask.resolve = progress.transferred
      }, 1000)
      stream.on('uploadProgress', onProgress)
      this.taskSignal[signalId] = abort
      await pipeline(
        //
        from,
        stream,
        {signal: abort.signal}
      )
      subtask.status = TaskStatus.finish
      this.emit('finish-task', task, subtask)
    } catch (e: any) {
      if (abort.signal.aborted) {
        subtask.status = TaskStatus.pause
      } else {
        subtask.status = TaskStatus.fail
        // message.error(e.message)
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
