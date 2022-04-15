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
import {Readable} from 'stream'
import {FormDataEncoder} from 'form-data-encoder'

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
    // 上传状态
    if (this.tasks.some(item => item.status === TaskStatus.fail)) return TaskStatus.fail
    if (this.tasks.some(item => item.status === TaskStatus.pause)) return TaskStatus.pause
    if (this.tasks.some(item => item.status === TaskStatus.pending)) return TaskStatus.pending
    if (this.tasks.every(item => item.status === TaskStatus.finish)) return TaskStatus.finish
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

    console.log('task.status', task.status, task.tasks.map(value => value.status).join(','))
    if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) return

    const taskIndex = task.tasks.findIndex(item => TaskStatus.ready === item.status)
    if (taskIndex === -1) return

    const subTask = task.tasks[taskIndex]
    subTask.status = TaskStatus.pending
    try {
      const form = createUploadForm(subTask, taskIndex)

      const updateResolve = debounce(
        (progress: Progress) => {
          // TODO：限制触发频率
          console.log('progress', progress)
          subTask.resolve = progress.transferred
        },
        {time: 1000}
      )

      // =======================================
      // const encoder = new FormDataEncoder(form)
      // const stream = http.request.stream.post('fileup.php', {
      //   headers: encoder.headers,
      //   throwHttpErrors: true,
      // })
      // stream.on('error', err => {
      //   console.log('err', err)
      // })
      // stream.on('uploadProgress', progress => {
      //   // TODO： 限制触发频率
      //   // console.log('progress', progress)
      //   subTask.resolve = progress.transferred
      // })
      //
      // const abort = new AbortController()
      // // setTimeout(() => {
      // //   abort.abort()
      // // }, 200)
      // await pipeline(
      //   //
      //   Readable.from(encoder),
      //   stream,
      //   new PassThrough(),
      //   {signal: abort.signal}
      // )
      // subTask.status = TaskStatus.finish
      // this.emit('finish-task', task, subTask)
      // =======================================
      const encoder = new FormDataEncoder(form)
      const req = http.request.post('fileup.php', {
        body: Readable.from(encoder),
        headers: encoder.headers,
        // body: form,
      })
      this.taskSignal[this.taskSignalId(subTask)] = req
      req.on('uploadProgress', progress => {
        // TODO： 限制触发频率
        // console.log('progress', progress)
        subTask.resolve = progress.transferred
      })
      // req.on('uploadProgress', updateResolve)
      await req
      subTask.status = TaskStatus.finish
      this.emit('finish-task', task, subTask)
      // =======================================

      // // const encoder = new FormDataEncoder(form)
      // const req = http.request.post('fileup.php', {
      //   // body: Readable.from(encoder),
      //   body: form,
      // })
      // this.taskSignal[this.taskSignalId(subTask)] = req
      // req
      //   .on('uploadProgress', progress => {
      //     // TODO： 限制触发频率
      //     console.log('progress', progress)
      //     subTask.resolve = progress.transferred
      //   })
      //   .then(() => {
      //     subTask.status = TaskStatus.finish
      //     this.emit('finish-task', task, subTask)
      //   })
      //   .catch(reason => {
      //     subTask.status = TaskStatus.fail
      //   })
    } catch (e: any) {
      // console.log('eeeeeeeeeeeeeeeeee', e)
      subTask.status = TaskStatus.fail
      // message.error(e)
    }

    // if (task && this.canStart()) {
    //   if (reset) {
    //     task.tasks.forEach(task => {
    //       if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) {
    //         task.status = TaskStatus.ready
    //       }
    //     })
    //   }
    //
    //   const taskIndex = task.tasks.findIndex(item => TaskStatus.ready === item.status)
    //   if (taskIndex !== -1) {
    //     const subTask = task.tasks[taskIndex]
    //     subTask.status = TaskStatus.pending
    //     try {
    //       const form = createUploadForm(subTask, taskIndex)
    //       // const encoder = new FormDataEncoder(form)
    //
    //       const updateResolve = debounce(
    //         (progress: Progress) => {
    //           // TODO：限制触发频率
    //           console.log('progress', progress)
    //           subTask.resolve = progress.transferred
    //         },
    //         {time: 1000}
    //       )
    //
    //       // =======================================
    //       // const encoder = new FormDataEncoder(form)
    //       // const stream = http.request.stream.post('fileup.php', {
    //       //   headers: encoder.headers,
    //       // })
    //       // stream.on('uploadProgress', progress => {
    //       //   // TODO： 限制触发频率
    //       //   console.log('progress', progress)
    //       //   subTask.resolve = progress.transferred
    //       // })
    //       //
    //       // const abort = new AbortController()
    //       // await pipeline(
    //       //   //
    //       //   // Buffer.from(form),
    //       //   Readable.from(encoder),
    //       //   stream,
    //       //   new PassThrough(),
    //       //   {signal: abort.signal}
    //       // )
    //       // subTask.status = TaskStatus.finish
    //       // this.emit('finish-task', task, subTask)
    //       // =======================================
    //
    //       // const encoder = new FormDataEncoder(form)
    //       const req = http.request.post('fileup.php', {
    //         // body: Readable.from(encoder),
    //         body: form,
    //       })
    //       this.taskSignal[this.taskSignalId(subTask)] = req
    //       req
    //         .on('uploadProgress', progress => {
    //           // TODO： 限制触发频率
    //           console.log('progress', progress)
    //           subTask.resolve = progress.transferred
    //         })
    //         .then(() => {
    //           subTask.status = TaskStatus.finish
    //           this.emit('finish-task', task, subTask)
    //         })
    //         .catch(reason => {
    //           subTask.status = TaskStatus.fail
    //         })
    //     } catch (e: any) {
    //       subTask.status = TaskStatus.fail
    //       message.error(e)
    //     }
    //   }
    // }
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
