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

const fs = requireModule('fs-extra')

export interface UploadInfo {
  readonly size?: TaskStatus
  readonly resolve?: TaskStatus
  readonly status?: TaskStatus

  path: string // 文件路径, 作为id
  folderId: FolderId
  name: string
  type: string

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

interface Upload {
  on(event: 'finish', listener: (info: UploadInfo) => void): this
  on(event: 'finish-task', listener: (info: UploadInfo, task: UploadTask) => void): this
  on(event: 'error', listener: (msg: string) => void): this

  removeListener(event: 'finish', listener: (info: UploadInfo) => void): this
  removeListener(event: 'finish-task', listener: (info: UploadInfo, task: UploadTask) => void): this
  removeListener(event: 'error', listener: (msg: string) => void): this

  emit(event: 'finish', info: UploadInfo)
  emit(event: 'finish-task', info: UploadInfo, task: UploadTask)
  emit(event: 'error', msg: string)
}

const FormData = requireModule('form-data')

/**
 * 分割完再上传
 * 上传进度 status update
 * 上传速度： todo
 * */

class Upload extends EventEmitter implements Task<UploadInfo> {
  handler: ReturnType<typeof autorun>
  taskSignal: {[resolvePathName: string]: AbortController} = {}

  list: UploadInfo[] = []

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
    const filePath = this.list.find(item => item.status === TaskStatus.ready)?.path
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
    lastModifiedDate: number
  }) {
    try {
      const info: UploadInfo = {
        name: options.name,
        path: options.path,
        folderId: options.folderId,
        type: options.type,
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
      // message.info(e)
      this.emit('error', e)
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

  private abortTask(task: UploadTask) {
    const path = resolve(task.path, task.name)
    if (this.taskSignal[path]) {
      this.taskSignal[path].abort()
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

  start(path: string) {
    const info = this.list.find(item => item.path === path)
    if (info && this.canStart(info)) {
      const task = info.tasks.find(item => [TaskStatus.ready, TaskStatus.fail].includes(item.status))
      if (task) {
        task.status = TaskStatus.pending
        try {
          const fr = fs.createReadStream(
            task.path,
            task.endByte ? {start: task.startByte, end: task.endByte} : undefined
          )

          const form = createUploadForm({
            fr,
            size: task.size,
            name: task.name,
            folderId: task.folderId,
            id: task.name,
            type: task.type,
          })

          const updateResolve = debounce(bytes => {
            task.resolve = bytes
          })

          const abort = new AbortController()
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
              }
            })
            .catch(reason => {
              task.status = TaskStatus.fail
            })

          this.taskSignal[resolve(task.path, task.name)] = abort
        } catch (e) {
          task.status = TaskStatus.fail
          this.emit('error', e)
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

const upload = new Upload()

export default upload

interface FormOptions {
  fr: ReturnType<typeof fs.createReadStream>
  size: number
  name: string
  folderId: FolderId
  id?: string
  type?: string
}

export function createUploadForm(options: FormOptions) {
  const form = new FormData()
  form.append('task', '1')
  form.append('ve', '2')
  form.append('lastModifiedDate', new Date().toString()) // todo: 保留文件修改日期？
  form.append('type', options.type || 'application/octet-stream')
  // form.append('type', 'application/octet-stream')
  form.append('id', options.id ?? 'WU_FILE_0')
  form.append('folder_id_bb_n', options.folderId)
  form.append('size', options.size)
  form.append('name', options.name)
  form.append('upload_file', options.fr, options.name)

  return form
}
