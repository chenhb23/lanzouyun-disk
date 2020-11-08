import {EventEmitter} from 'events'
import {autorun, makeObservable} from 'mobx'
import {resolve} from 'path'
import Task, {makeGetterProps, TaskStatus} from './AbstractTask'
import {fileDownUrl, parseUrl, pwdFileDownUrl, sendDownloadTask} from '../../common/core/download'
import {delay, isSpecificFile, mkTempDirSync, restoreFileName, sizeToByte} from '../../common/util'
import {lsFile, lsShare, lsShareFolder} from '../../common/core/ls'
import requireModule from '../../common/requireModule'
import merge from '../../common/merge'
import {fileDetail, folderDetail} from '../../common/core/detail'
import IpcEvent from '../../common/IpcEvent'
import store from '../../main/store'
import {message} from '../component/Message'
import {persist} from 'mobx-persist'

const electron = requireModule('electron')
const fs = requireModule('fs-extra')

interface DownloadInfo {
  readonly size?: number
  readonly resolve?: number
  readonly status?: TaskStatus

  url: string
  name: string
  pwd?: string
  merge?: boolean
  path: string
  tasks: DownloadTask[]
}

interface DownloadTask {
  url: string
  name: string
  resolve: number
  status: TaskStatus
  pwd?: string
  path: string
  size: number
}

export interface Download {
  on(event: 'finish', listener: (info: DownloadInfo) => void): this
  on(event: 'finish-task', listener: (info: DownloadInfo, task: DownloadTask) => void): this
  // on(event: 'error', listener: (msg: string) => void): this

  removeListener(event: 'finish', listener: (info: DownloadInfo) => void): this
  removeListener(event: 'finish-task', listener: (info: DownloadInfo, task: DownloadTask) => void): this
  // removeListener(event: 'error', listener: (msg: string) => void): this

  emit(event: 'finish', info: DownloadInfo)
  emit(event: 'finish-task', info: DownloadInfo, task: DownloadTask)
  // emit(event: 'error', msg: string)
}

export class Download extends EventEmitter implements Task<DownloadInfo> {
  handler: ReturnType<typeof autorun>
  taskSignal: {[taskUrl: string]: AbortController} = {}
  @persist('list') list: DownloadInfo[] = []
  @persist('list') finishList: DownloadInfo[] = []
  @persist dir = ''

  get queue() {
    return this.getList(item => item.status === TaskStatus.pending).length
  }

  constructor() {
    super()
    makeObservable(this, {
      list: true,
      finishList: true,
      dir: true,
    })

    process.nextTick(this.init)
  }

  private init = () => {
    if (!this.dir) {
      store.get('downloads').then(value => (this.dir = value))
    }

    this.startQueue()
    this.on('finish', info => {
      delay(200).then(() => this.onTaskFinish(info))
      this.remove(info.url)
      this.finishList.push(info)
    })
    this.on('finish-task', (info, task) => {
      delete this.taskSignal[task.url]
      if (info.tasks.every(item => item.status === TaskStatus.finish)) {
        this.emit('finish', info)
      } else {
        this.start(info.url)
      }
    })
  }

  async onTaskFinish(info: DownloadInfo) {
    const resolveTarget = resolve(info.path, info.name)
    if (info.merge) {
      const tempDir = info.tasks[0].path
      const files = fs.readdirSync(tempDir).map(name => resolve(tempDir, name))
      await merge(files, resolveTarget)
      await delay(200)
      // 删除临时文件夹
      fs.removeSync(tempDir)
    } else if (isSpecificFile(info.name)) {
      fs.renameSync(resolveTarget, restoreFileName(resolveTarget))
    }
  }

  startQueue() {
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

  checkTask() {
    const url = this.list.find(item => item.status === TaskStatus.ready)?.url
    if (url) {
      this.start(url)
    }
  }

  getList(filter: (item: DownloadTask) => boolean) {
    return this.list
      .map(item => item.tasks)
      .flat()
      .filter(filter)
  }

  canStart(info: DownloadInfo) {
    return this.queue < 3 // && info.status !== InitStatus.pending
  }

  abortTask = (task: DownloadTask) => {
    if (this.taskSignal[task.url]) {
      this.taskSignal[task.url].abort()
      delete this.taskSignal[task.url]
    }
  }

  pause(url: string) {
    this.list
      .find(item => item.url === url)
      ?.tasks?.forEach(task => {
        if ([TaskStatus.ready, TaskStatus.pending].includes(task.status)) {
          task.status = TaskStatus.pause
          this.abortTask(task)
        }
      })
  }

  pauseAll() {
    this.list.forEach(item => this.pause(item.url))
  }

  remove(url: string) {
    this.list.find(item => item.url === url)?.tasks?.forEach(this.abortTask)
    this.list = this.list.filter(item => item.url !== url)
  }

  removeAll() {
    this.list.forEach(info => info.tasks.forEach(this.abortTask))
    this.list = []
  }

  removeAllFinish() {
    this.finishList = []
  }

  async start(url: string, resetAll = false) {
    const info = this.list.find(item => item.url === url)
    if (info && this.canStart(info)) {
      if (resetAll) {
        info.tasks.forEach(task => {
          if ([TaskStatus.pause, TaskStatus.fail].includes(task.status)) {
            task.status = TaskStatus.ready
          }
        })
      }
      const task = info.tasks.find(task => TaskStatus.ready === task.status)
      if (task) {
        task.status = TaskStatus.pending
        try {
          const {url: downloadUrl} = task.pwd ? await pwdFileDownUrl(task.url, task.pwd) : await fileDownUrl(task.url)

          const abort = new AbortController()

          const replyId = task.url
          const ipcMessage: IpcDownloadMsg = {
            replyId: task.url,
            downUrl: downloadUrl,
            folderPath: task.path,
          }

          await sendDownloadTask(ipcMessage)
          const removeListener = () => {
            electron.ipcRenderer
              .removeAllListeners(`${IpcEvent.progressing}${replyId}`)
              .removeAllListeners(`${IpcEvent.done}${replyId}`)
              .removeAllListeners(`${IpcEvent.failed}${replyId}`)
          }

          electron.ipcRenderer
            .on(`${IpcEvent.progressing}${replyId}`, (event, receivedByte) => {
              task.resolve = receivedByte
            })
            .once(`${IpcEvent.done}${replyId}`, () => {
              task.status = TaskStatus.finish
              this.emit('finish-task', info, task)
              removeListener()
            })
            .once(`${IpcEvent.failed}${replyId}`, () => {
              task.status = TaskStatus.fail
              removeListener()
            })

          this.taskSignal[task.url] = abort
          abort.signal.onabort = () => {
            electron.ipcRenderer.send(IpcEvent.abort, replyId)
            removeListener()
          }
        } catch (e) {
          task.status = TaskStatus.fail
          message.error(e)
        }
      }
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

  getFileDir() {
    return this.dir
  }

  /**
   * 新增列表文件任务
   */
  async addFileTask(options: {name: string; size: number; file_id: string}) {
    try {
      const folderDir = this.getFileDir()
      const {f_id, is_newd, pwd, onof} = await fileDetail(options.file_id)
      const url = `${is_newd}/${f_id}`
      const info: DownloadInfo = {
        url,
        path: folderDir,
        ...options,
        tasks: [
          {
            url,
            name: options.name,
            resolve: 0,
            status: TaskStatus.ready,
            pwd: onof == '1' ? pwd : '',
            path: folderDir,
            size: options.size,
          },
        ],
      }

      makeGetterProps(info)
      this.list.push(info)
    } catch (e) {
      message.error(e)
    }
  }

  /**
   * 新增分享文件任务
   */
  async addShareFileTask(options: {url: string; pwd?: string}) {
    try {
      const {url} = options
      const folderDir = this.getFileDir()
      const {name, size} = await lsShare(options)
      const task: DownloadInfo = {
        path: folderDir,
        ...options,
        name,
        tasks: [
          {
            url,
            name,
            resolve: 0,
            status: TaskStatus.ready,
            pwd: options.pwd,
            path: folderDir,
            size: sizeToByte(size),
          },
        ],
      }
      makeGetterProps(task)
      this.list.push(task)
    } catch (e) {
      message.error(e)
    }
  }

  /**
   * 下载列表文件夹文件
   * @param options
   */
  async addFolderTask(options: {folder_id: FolderId; name: string; merge?: boolean}) {
    try {
      let folderDir = this.getFileDir()
      const [detail, files] = await Promise.all([folderDetail(options.folder_id), lsFile(options.folder_id)])
      const info: DownloadInfo = {
        path: folderDir,
        url: detail.new_url,
        pwd: detail.onof === '1' ? detail.pwd : '',
        merge: options.merge,
        name: options.name,
        // ...options,
        tasks: [],
      }
      if (options.merge) {
        folderDir = mkTempDirSync()
      }

      const fileInfos = await Promise.all(files.map(file => fileDetail(file.id)))
      info.tasks.push(
        ...fileInfos.map((info, index) => ({
          url: `${info.is_newd}/${info.f_id}`,
          name: files[index]?.name_all,
          resolve: 0,
          status: TaskStatus.ready,
          pwd: info.onof === '1' ? info.pwd : '',
          path: folderDir,
          size: sizeToByte(files[index]?.size),
        }))
      )

      makeGetterProps(info)
      this.list.push(info)
    } catch (e) {
      message.error(e)
    }
  }

  /**
   * 下载分享文件夹
   * merge: 自动合并下载文件
   */
  async addShareFolderTask(options: {url: string; pwd?: string; merge?: boolean}) {
    try {
      const {is_newd} = parseUrl(options.url)
      let folderDir = this.getFileDir()
      const info: DownloadInfo = {
        path: folderDir,
        name: '',
        tasks: [],
        ...options,
      }
      const {name, list} = await lsShareFolder(options)
      if (options.merge) {
        folderDir = mkTempDirSync()
      }
      info.name = name
      info.tasks.push(
        ...list.map<DownloadTask>(item => ({
          url: `${is_newd}/${item.id}`,
          name: item.name_all,
          resolve: 0,
          status: TaskStatus.ready,
          pwd: '',
          path: folderDir,
          size: sizeToByte(item.size),
        }))
      )

      makeGetterProps(info)
      this.list.push(info)
    } catch (e) {
      message.error(e)
    }
  }
}
