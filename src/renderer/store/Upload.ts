import {EventEmitter} from 'events'
import {resolve} from 'path'
import {autorun, makeAutoObservable, makeObservable, observable} from 'mobx'
import Task, {TaskStatus} from './AbstractTask'
import config from '../../project.config'
import {createSpecificName, debounce, sizeToByte} from '../../common/util'
import {isExistByName} from '../../common/core/isExist'
import {mkdir} from '../../common/core/mkdir'
import {splitTask} from '../../common/split'
import {message} from '../component/Message'
import {persist} from 'mobx-persist'
import * as http from '../../common/http'
import {FormData} from 'formdata-node'
// import {FormDataEncoder} from 'form-data-encoder'

import fs from 'fs-extra'
// import FormData from 'form-data'
import type {CancelableRequest} from 'got'
import type {Progress} from 'got/dist/source/core'

export type UploadFile = Pick<File, 'size' | 'name' | 'type' | 'path' | 'lastModified'>

export interface UploadSubTask {
  name: string // 自定义
  size: number // 自定义

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
    if (this.tasks.some(item => item.status === TaskStatus.pending)) return TaskStatus.pending
    return TaskStatus.ready
  }
}

export interface Upload {
  on(event: 'finish', listener: (info: UploadTask) => void): this
  on(event: 'finish-task', listener: (info: UploadTask, task: UploadSubTask) => void): this
  // on(event: 'error', listener: (msg: string) => void): this

  removeListener(event: 'finish', listener: (info: UploadTask) => void): this
  removeListener(event: 'finish-task', listener: (info: UploadTask, task: UploadSubTask) => void): this
  // removeListener(event: 'error', listener: (msg: string) => void): this

  emit(event: 'finish', info: UploadTask)
  emit(event: 'finish-task', info: UploadTask, task: UploadSubTask)
  // emit(event: 'error', msg: string)
}

/**
 * 分割完再上传
 * 上传进度 status update
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
    this.on('finish-task', (info, task) => {
      delete this.taskSignal[resolve(info.file.path, task.name)]
      if (info.tasks.every(item => item.status === TaskStatus.finish)) {
        this.emit('finish', info)
      } else {
        this.start(info.file.path)
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
    const filePath = this.list.find(item =>
      item.tasks.some(task => [TaskStatus.ready, TaskStatus.fail].includes(task.status))
    )?.file?.path
    if (filePath) {
      this.start(filePath)
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
      const file = options.file
      const task = new UploadTask({
        file,
        folderId: options.folderId,
      })

      if (file.size <= sizeToByte(config.maxSize)) {
        let supportName = file.name
        if (config.supportList.every(ext => !file.path.endsWith(`.${ext}`))) {
          // info.type = ''
          supportName = createSpecificName(supportName)
        }
        task.tasks.push({
          name: supportName,
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
        const result = splitTask(file)
        task.tasks.push(
          ...result.splitFiles.map(value => ({
            name: value.name,
            size: value.size,
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
          task.status = TaskStatus.pause
          this.abortTask(task)
        }
      })
  }

  pauseAll() {
    this.list.forEach(item => this.pause(item.file.path))
  }

  private abortTask = (task: UploadSubTask) => {
    const id = this.taskSignalId(task)
    if (this.taskSignal[id]) {
      if (!this.taskSignal[id].isCanceled) {
        this.taskSignal[id].cancel('用户取消上传')
      }
      delete this.taskSignal[id]
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

  start(path: string, resetAll = false) {
    const info = this.list.find(item => item.file.path === path)
    if (info && this.canStart()) {
      if (resetAll) {
        info.tasks.forEach(task => {
          if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) {
            task.status = TaskStatus.ready
          }
        })
      }

      const taskIndex = info.tasks.findIndex(item => TaskStatus.ready === item.status)
      if (taskIndex !== -1) {
        const task = info.tasks[taskIndex]
        task.status = TaskStatus.pending
        try {
          const form = createUploadForm(task, taskIndex)
          // const encoder = new FormDataEncoder(form)

          const updateResolve = debounce(
            (progress: Progress) => {
              console.log('progress', progress)
              task.resolve = progress.transferred
            },
            {time: 1000}
          )

          const req = http.request.post('fileup.php', {
            // body: Readable.from(form),
            body: form,
          })
          this.taskSignal[this.taskSignalId(task)] = req
          req
            .on('uploadProgress', progress => {
              // TODO： 限制触发频率
              console.log('progress', progress)
              task.resolve = progress.transferred
            })
            .then(() => {
              task.status = TaskStatus.finish
              this.emit('finish-task', info, task)
            })
            .catch(reason => {
              task.status = TaskStatus.fail
            })
        } catch (e: any) {
          task.status = TaskStatus.fail
          message.error(e)
        }
      }
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

function createUploadForm(options: UploadSubTask, taskIndex: number) {
  const form = new FormData()
  const sourceFile = options.sourceFile
  const type = sourceFile.type || 'application/octet-stream'

  const fr = options.endByte
    ? fs.createReadStream(sourceFile.path, {start: options.startByte, end: options.endByte})
    : fs.createReadStream(sourceFile.path)

  form.append('task', 1)
  form.append('ve', 2)
  form.append('lastModifiedDate', new Date(sourceFile.lastModified))
  form.append('type', type)
  form.append('id', `WU_FILE_${taskIndex}`)
  form.append('folder_id_bb_n', options.folderId)
  form.append('size', options.size)
  form.append('name', options.name)
  form.append(
    'upload_file',
    {
      [Symbol.toStringTag]: 'File',
      size: options.size,
      name: options.name,
      type,
      stream() {
        return fr
      },
    },
    options.name
  )
  return form
}
