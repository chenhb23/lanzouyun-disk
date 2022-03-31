import {EventEmitter} from 'events'
import {resolve} from 'path'
import {autorun, makeObservable} from 'mobx'
import Task, {makeGetterProps, TaskStatus} from './AbstractTask'
import config from '../../project.config'
import {createSpecificName, debounce, sizeToByte} from '../../common/util'
import {isExistByName} from '../../common/core/isExist'
import {mkdir} from '../../common/core/mkdir'
import split from '../../common/split'
import requireModule from '../../common/requireModule'
import request from '../../common/request'
import {message} from '../component/Message'
import {persist} from 'mobx-persist'

const fs = requireModule('fs-extra')

export interface UploadInfo {
  readonly size?: TaskStatus
  readonly resolve?: TaskStatus
  readonly status?: TaskStatus

  path: string // 文件路径, 作为id
  folderId: FolderId
  name: string
  type: string // 文件类型 mime
  lastModified: number

  tasks: UploadTask[]
}

export interface UploadTask {
  size: number
  type: string
  status: TaskStatus
  resolve: number
  name: string
  path: string
  folderId: FolderId
  startByte?: number
  endByte?: number
}

export interface Upload {
  on(event: 'finish', listener: (info: UploadInfo) => void): this
  on(event: 'finish-task', listener: (info: UploadInfo, task: UploadTask) => void): this
  // on(event: 'error', listener: (msg: string) => void): this

  removeListener(event: 'finish', listener: (info: UploadInfo) => void): this
  removeListener(event: 'finish-task', listener: (info: UploadInfo, task: UploadTask) => void): this
  // removeListener(event: 'error', listener: (msg: string) => void): this

  emit(event: 'finish', info: UploadInfo)
  emit(event: 'finish-task', info: UploadInfo, task: UploadTask)
  // emit(event: 'error', msg: string)
}

const FormData = requireModule('form-data')

/**
 * 分割完再上传
 * 上传进度 status update
 * 上传速度： todo
 * */

export class Upload extends EventEmitter implements Task<UploadInfo> {
  handler: ReturnType<typeof autorun>
  taskSignal: {[resolvePathName: string]: AbortController} = {}

  @persist('list') list: UploadInfo[] = []

  get queue() {
    return this.getList(item => item.status === TaskStatus.pending).length
  }

  constructor() {
    super()
    makeObservable(this, {
      list: true,
    })

    process.nextTick(this.init)
  }

  private init = () => {
    this.startQueue()
    this.on('finish', info => {
      this.remove(info.path)
    })
    this.on('finish-task', (info, task) => {
      delete this.taskSignal[resolve(task.path, task.name)]
      if (info.tasks.every(item => item.status === TaskStatus.finish)) {
        this.emit('finish', info)
      } else {
        this.start(info.path)
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
    )?.path
    if (filePath) {
      this.start(filePath)
    }
  }

  stopQueue() {
    this.handler?.()
    this.handler = null
  }

  getList(filter: (item: UploadTask) => boolean) {
    return this.list
      .map(item => item.tasks)
      .flat()
      .filter(filter)
  }

  async addTask(options: {
    folderId: FolderId
    size: number
    name: string
    type: string
    path: string // 全路径
    lastModified: number
  }) {
    try {
      const info: UploadInfo = {
        name: options.name,
        path: options.path,
        folderId: options.folderId,
        type: options.type,
        lastModified: options.lastModified,
        tasks: [],
      }
      if (options.size <= sizeToByte(config.maxSize)) {
        let supportName = options.name
        if (config.supportList.every(ext => !info.path.endsWith(`.${ext}`))) {
          info.type = ''
          supportName = createSpecificName(supportName)
        }
        info.tasks.push({
          name: supportName,
          path: info.path,
          folderId: info.folderId,
          resolve: 0,
          size: options.size,
          status: TaskStatus.ready,
          type: info.type,
        })
      } else {
        let subFolderId = await isExistByName(info.folderId, info.name).then(value => value?.fol_id)
        if (!subFolderId) {
          subFolderId = await mkdir(info.folderId, info.name)
        }
        const splitData = await split(info.path, {fileSize: options.size, skipSplit: true})
        info.tasks.push(
          ...splitData.splitFiles.map<UploadTask>(file => ({
            name: file.name,
            path: info.path,
            folderId: subFolderId,
            resolve: 0,
            size: file.size,
            status: TaskStatus.ready,
            type: info.type,
            startByte: file.startByte,
            endByte: file.endByte,
          }))
        )
      }

      makeGetterProps(info)
      this.list.push(info)
    } catch (e) {
      message.error(e)
    }
  }

  pause(path: string) {
    this.list
      .find(item => item.path === path)
      ?.tasks?.forEach(task => {
        if ([TaskStatus.ready, TaskStatus.pending].includes(task.status)) {
          task.status = TaskStatus.pause
          this.abortTask(task)
        }
      })
  }

  pauseAll() {
    this.list.forEach(item => this.pause(item.path))
  }

  private abortTask = (task: UploadTask) => {
    const path = resolve(task.path, task.name)
    if (this.taskSignal[path]) {
      if (!this.taskSignal[path].signal?.aborted) {
        this.taskSignal[path].abort()
      }
      delete this.taskSignal[path]
    }
  }

  remove(path: string) {
    this.list.find(item => item.path === path)?.tasks?.forEach(this.abortTask)
    this.list = this.list.filter(item => item.path !== path)
  }

  removeAll() {
    this.list.forEach(info => info.tasks.forEach(this.abortTask))
    this.list = []
  }

  start(path: string, resetAll = false) {
    const info = this.list.find(item => item.path === path)
    if (info && this.canStart(info)) {
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
          const fr = task.endByte
            ? fs.createReadStream(task.path, {start: task.startByte, end: task.endByte})
            : fs.createReadStream(task.path)

          const form = createUploadForm({
            fr,
            size: task.size,
            name: task.name,
            folderId: task.folderId,
            id: task.name,
            type: task.type,
            lastModified: info.lastModified,
            taskIndex,
          })

          const updateResolve = debounce(bytes => (task.resolve = bytes), {time: 1000})

          const abort = new AbortController()
          this.taskSignal[resolve(task.path, task.name)] = abort

          request<Do1Res, any>({
            path: '/fileup.php',
            body: form,
            onData: updateResolve,
            signal: abort.signal,
          })
            .then(value => {
              if (value.zt === 1) {
                task.status = TaskStatus.finish
                this.emit('finish-task', info, task)
              } else {
                task.status = TaskStatus.fail
                console.log(value)
              }
            })
            .catch(reason => {
              task.status = TaskStatus.fail
            })
        } catch (e) {
          task.status = TaskStatus.fail
          message.error(e)
        }
      }
    }
  }

  canStart(info: UploadInfo) {
    return this.queue < 3
  }

  startAll() {
    this.list.forEach(info => {
      info.tasks.forEach(task => {
        if (task.status === TaskStatus.pause) {
          task.status = TaskStatus.ready
        }
      })

      this.start(info.path)
    })
  }
}

interface FormOptions {
  fr: ReturnType<typeof fs.createReadStream>
  size: number
  name: string
  folderId: FolderId
  id?: string
  type?: string
  lastModified: number
  taskIndex: number
}

export function createUploadForm(options: FormOptions) {
  const form = new FormData()
  form.append('task', '1')
  form.append('ve', '2')
  form.append('lastModifiedDate', new Date(options.lastModified).toString())
  form.append('type', options.type || 'application/octet-stream')
  // form.append('id', options.id ?? 'WU_FILE_0')
  form.append('id', `WU_FILE_${options.taskIndex}`)
  form.append('folder_id_bb_n', options.folderId)
  form.append('size', options.size)
  form.append('name', options.name)
  form.append('upload_file', options.fr, options.name)

  return form
}
