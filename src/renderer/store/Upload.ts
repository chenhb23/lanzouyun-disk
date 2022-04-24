import {EventEmitter} from 'events'
import {resolve} from 'path'
import {autorun, makeAutoObservable, makeObservable, observable} from 'mobx'
import {persist} from 'mobx-persist'
import {FormData} from 'formdata-node'
import fs from 'fs-extra'
import type {CancelableRequest} from 'got'
import type {Progress} from 'got/dist/source/core'
import throttle from 'lodash.throttle'

import Task, {TaskStatus} from './AbstractTask'
import project, {supportList} from '../../project.config'
import {createSpecificName, sizeToByte} from '../../common/util'
import {isExistByName} from '../../common/core/isExist'
import {mkdir} from '../../common/core/mkdir'
import {splitTask} from '../../common/split'
import {message} from '../component/Message'
import * as http from '../../common/http'
import {config} from './Config'

export type UploadFile = {
  size: File['size']
  name: File['name']
  type: File['type']
  path: File['path']
  lastModified: File['lastModified']
}

export interface UploadSubTask {
  name: string // 自定义
  size: number // 自定义
  type: string // 自定义 // todo: delete

  sourceFile: UploadFile

  folderId: FolderId // 小文件为当前目录id，大文件为新建文件的id
  status: TaskStatus
  resolve: number
  startByte?: number
  endByte?: number
}

export class UploadTask {
  folderId: FolderId // = null
  file: UploadFile // = null
  tasks: UploadSubTask[] = []

  constructor(props: Partial<UploadTask> = {}) {
    makeAutoObservable(this)
    Object.assign(this, props)
  }

  // 使用 file.size 代替
  // get size() {
  //   return this.tasks.reduce((total, item) => total + (item.size ?? 0), 0)
  // }

  get resolve() {
    return this.tasks.reduce((total, item) => total + (item.resolve ?? 0), 0)
  }

  get status() {
    // 上传状态
    if (this.tasks.some(item => item.status === TaskStatus.fail)) return TaskStatus.fail
    if (this.tasks.some(item => item.status === TaskStatus.pause)) return TaskStatus.pause
    if (this.tasks.some(item => item.status === TaskStatus.pending)) return TaskStatus.pending
    if (this.tasks.length && this.tasks.every(item => item.status === TaskStatus.finish)) return TaskStatus.finish
    return TaskStatus.ready
  }
}

export interface Upload {
  on(event: 'finish', listener: (info: UploadTask) => void): this
  on(event: 'finish-task', listener: (info: UploadTask, task: UploadSubTask) => void): this
  // on(event: 'error', listener: (msg: string) => void): this

  // todo: 使用 off?
  removeListener(event: 'finish', listener: (info: UploadTask) => void): this
  removeListener(event: 'finish-task', listener: (info: UploadTask, task: UploadSubTask) => void): this
  // removeListener(event: 'error', listener: (msg: string) => void): this

  emit(event: 'finish', info: UploadTask)
  emit(event: 'finish-task', info: UploadTask, task: UploadSubTask)
  // emit(event: 'error', msg: string)
}

/**
 * 说明
 * 文件尽量放到文件夹压缩后再上传！
 * 上传速度： todo
 * */

export class Upload extends EventEmitter implements Task<UploadTask> {
  handler: ReturnType<typeof autorun>
  taskSignal: {[resolvePathName: string]: CancelableRequest} = {}

  @persist('list') list: UploadTask[] = []

  private taskSignalId(task: Pick<UploadSubTask, 'sourceFile'>) {
    return resolve(task.sourceFile.path, task.sourceFile.name)
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
    this.on('finish-task', task => {
      // delete this.taskSignal[resolve(info.file.path, task.name)]
      if (task.tasks.every(item => item.status === TaskStatus.finish)) {
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

  getList(filter: (item: UploadSubTask) => boolean) {
    return this.list
      .map(item => item.tasks)
      .flat()
      .filter(filter)
  }

  async addTask(options: {folderId: FolderId; file: UploadFile}) {
    try {
      const file: UploadFile = {
        size: options.file.size,
        name: options.file.name,
        type: options.file.type,
        path: options.file.path,
        lastModified: options.file.lastModified,
      }
      const task = new UploadTask({
        file,
        folderId: options.folderId,
      })

      if (file.size <= sizeToByte(config.maxSize)) {
        let supportName = file.name
        let type = file.type
        if (supportList.every(ext => !file.path.endsWith(`.${ext}`))) {
          supportName = createSpecificName(supportName)
          // type = getFileType(supportName)
          type = null
        }
        task.tasks.push({
          name: supportName,
          type: type,
          size: file.size,
          sourceFile: file,
          folderId: options.folderId,
          status: TaskStatus.ready,
          resolve: 0,
        })
      } else {
        let subFolderId = await isExistByName(options.folderId, file.name).then(value => value?.fol_id)
        if (!subFolderId) {
          subFolderId = await mkdir(options.folderId, file.name)
        }
        const result = splitTask(file, config.splitSize)
        task.tasks.push(
          ...result.splitFiles.map(value => ({
            name: value.name,
            size: value.size,
            // type: getFileType(value.name),
            type: null,
            sourceFile: value.sourceFile,
            status: TaskStatus.ready,
            folderId: subFolderId,
            resolve: 0,
            startByte: value.startByte,
            endByte: value.endByte,
          }))
        )
      }
      this.list.push(task)
    } catch (e: any) {
      message.error(e)
    }
  }

  pause(path: string) {
    this.list
      .find(item => item.file.path === path)
      ?.tasks?.forEach(task => {
        if ([TaskStatus.ready, TaskStatus.pending].includes(task.status)) {
          // todo: 让状态自动变为 TaskStatus.pause 而不是手动控制
          task.status = TaskStatus.pause
          this.abortTask(task)
        }
      })
  }

  pauseAll() {
    this.list.forEach(item => this.pause(item.file.path))
  }

  private abortTask = (subTask: UploadSubTask) => {
    const id = this.taskSignalId(subTask)
    if (this.taskSignal[id]) {
      this.taskSignal[id].cancel('用户取消上传')
      delete this.taskSignal[id] // todo
    }
  }

  remove(path: string) {
    this.list.find(item => item.file.path === path)?.tasks?.forEach(this.abortTask)
    this.list = this.list.filter(item => item.file.path !== path)
  }

  removeAll() {
    this.list.forEach(info => info.tasks.forEach(this.abortTask))
    this.list = []
  }

  async start(path: string, reset = false) {
    const task = this.list.find(item => item.file.path === path)
    if (!task) return
    if (!this.canStart()) return

    if (reset) {
      task.tasks.forEach(task => {
        if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) {
          task.status = TaskStatus.ready
        }
      })
    }

    if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) return

    const taskIndex = task.tasks.findIndex(item => TaskStatus.ready === item.status)
    if (taskIndex === -1) return

    const subTask = task.tasks[taskIndex]
    subTask.status = TaskStatus.pending
    const signalId = this.taskSignalId(subTask)
    const form = createUploadForm(subTask, taskIndex)

    const onProgress = throttle((progress: Progress) => {
      subTask.resolve = progress.transferred
    }, 1000)
    const req = http.request
      .post('fileup.php', {
        body: form,
      })
      .on('uploadProgress', onProgress)
    try {
      this.taskSignal[signalId] = req
      await req
      subTask.status = TaskStatus.finish
      this.emit('finish-task', task, subTask)
    } catch (e: any) {
      if (req.isCanceled) {
        subTask.status = TaskStatus.pause
      } else {
        subTask.status = TaskStatus.fail
        message.error(e)
      }
    } finally {
      delete this.taskSignal[signalId]
    }
  }

  canStart() {
    return this.queue < 3
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

// interface FormOptions {
//   fr: ReturnType<typeof fs.createReadStream>
//   size: number
//   name: string
//   folderId: FolderId
//   id?: string
//   type?: string
//   lastModified: number
//   taskIndex: number
// }

// export function createUploadForm(options: FormOptions) {
//   const form = new FormData()
//   form.append('task', '1')
//   form.append('ve', '2')
//   form.append('lastModifiedDate', new Date(options.lastModified).toString())
//   form.append('type', options.type || 'application/octet-stream')
//   // form.append('id', options.id ?? 'WU_FILE_0')
//   form.append('id', `WU_FILE_${options.taskIndex}`)
//   form.append('folder_id_bb_n', options.folderId)
//   form.append('size', options.size)
//   form.append('name', options.name)
//   form.append('upload_file', options.fr, options.name)
//
//   return form
// }

function createUploadForm(subTask: UploadSubTask, taskIndex: number) {
  const form = new FormData()
  const sourceFile = subTask.sourceFile
  const type = subTask.type || 'application/octet-stream'

  const fr = subTask.endByte
    ? fs.createReadStream(sourceFile.path, {start: subTask.startByte, end: subTask.endByte})
    : fs.createReadStream(sourceFile.path)

  form.append('task', 1)
  form.append('ve', 2)
  form.append('lastModifiedDate', new Date(sourceFile.lastModified))
  form.append('type', type)
  form.append('id', `WU_FILE_${taskIndex}`)
  form.append('folder_id_bb_n', subTask.folderId)
  form.append('size', subTask.size)
  form.append('name', subTask.name)
  form.append(
    'upload_file',
    {
      [Symbol.toStringTag]: 'File',
      size: subTask.size,
      name: subTask.name,
      type,
      stream() {
        return fr
      },
    },
    subTask.name
  )
  return form
}
