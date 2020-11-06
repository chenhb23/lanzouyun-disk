import {EventEmitter} from 'events'
import {autorun, makeObservable, toJS} from 'mobx'
import {resolve} from 'path'
import Task, {makeSizeStatus, TaskStatus} from './AbstractTask'
import {downloadPageInfo, fileDownUrl, parseUrl, pwdFileDownUrl, sendDownloadTask} from '../../common/core/download'
import {delay, isSpecificFile, mkTempDirSync, restoreFileName, sizeToByte} from '../../common/util'
import {lsFile, lsShareFolder} from '../../common/core/ls'
import requireModule from '../../common/requireModule'
import merge from '../../common/merge'
import {fileDetail, folderDetail} from '../../common/core/detail'

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
  folderPath: string
  tasks: DownloadTask[]
}

interface DownloadTask {
  url: string
  name: string
  resolve: number
  status: TaskStatus
  pwd?: string
  folderPath: string
  size: number
}

export interface Download {
  on(event: 'finish', listener: (info: DownloadInfo) => void): this
  on(event: 'finish-task', listener: (info: DownloadInfo, task: DownloadTask) => void): this

  removeListener(event: 'finish', listener: (info: DownloadInfo) => void): this
  removeListener(event: 'finish-task', listener: (info: DownloadInfo, task: DownloadTask) => void): this

  emit(event: 'finish', info: DownloadInfo)
  emit(event: 'finish-task', info: DownloadInfo, task: DownloadTask)
}

export class Download extends EventEmitter implements Task<DownloadInfo> {
  handler: ReturnType<typeof autorun>
  taskSignal: {[url: string]: AbortController} = {}
  list: DownloadInfo[] = []
  finishList: DownloadInfo[] = []

  get queue() {
    return this.getList(item => item.status === TaskStatus.pending).length
  }

  constructor() {
    super()
    makeObservable(this, {
      list: true,
      finishList: true,
    })

    process.nextTick(this.init)
  }

  private init = () => {
    this.startQueue()
    this.on('finish', info => {
      this.onTaskFinish(info)
      this.remove(info.url)
      this.finishList.push(info)
    })
    this.on('finish-task', info => {
      if (info.tasks.every(item => item.status === TaskStatus.finish)) {
        this.emit('finish', info)
      } else {
        this.start(info.url)
      }
    })
  }

  async onTaskFinish(info: DownloadInfo) {
    const resolveTarget = resolve(info.folderPath, info.name)
    if (info.merge) {
      const tempDir = info.tasks[0].folderPath
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
    // const url = this.list.find(item => item.tasks.some(task => task.status === TaskStatus.ready))?.url
    // todo: some
    console.log(toJS(this.list))
    console.log(url)
    if (url) {
      console.log('url', url)
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

  pause(...args) {}

  pauseAll() {}

  remove(url: string) {
    this.list = this.list.filter(item => item.url !== url)
  }

  removeAll() {}

  removeAllFinish() {
    this.finishList = []
  }

  async start(url: string) {
    const info = this.list.find(item => item.url === url)
    if (info && this.canStart(info)) {
      const task = info.tasks.find(item => [TaskStatus.ready, TaskStatus.fail].includes(item.status))
      if (task) {
        const {url: downloadUrl} = task.pwd ? await pwdFileDownUrl(task.url, task.pwd) : await fileDownUrl(task.url)

        task.status = TaskStatus.pending

        const replyId = task.url
        const ipcMessage: IpcDownloadMsg = {
          replyId: task.url,
          downUrl: downloadUrl,
          folderPath: task.folderPath,
        }

        await sendDownloadTask(ipcMessage)
        const removeListener = () => {
          electron.ipcRenderer
            .removeAllListeners(`progressing${replyId}`)
            .removeAllListeners(`done${replyId}`)
            .removeAllListeners(`failed${replyId}`)
        }

        electron.ipcRenderer
          .on(`progressing${replyId}`, (event, receivedByte) => {
            task.resolve = receivedByte
          })
          .once(`done${replyId}`, () => {
            task.status = TaskStatus.finish
            this.emit('finish-task', info, task)
            removeListener()
          })
          .once(`failed${replyId}`, () => {
            task.status = TaskStatus.fail
            removeListener()
          })

        const abort = new AbortController()
        this.taskSignal[task.url] = abort
        abort.signal.onabort = () => {
          electron.ipcRenderer.send('abort', replyId)
          removeListener()
        }
      }
    }
  }

  startAll() {}

  getFileDir() {
    return '/Users/chb/Desktop/tempDownload'
  }

  /**
   * 新增列表文件任务
   */
  async addFileTask(options: {name: string; size: number; file_id: string}) {
    const folderDir = this.getFileDir()
    const {f_id, is_newd, pwd, onof} = await fileDetail(options.file_id)
    console.log({f_id, is_newd, pwd, onof})
    const url = `${is_newd}/${f_id}`
    const info: DownloadInfo = {
      url,
      folderPath: folderDir,
      ...options,
      tasks: [
        {
          url,
          name: options.name,
          resolve: 0,
          status: TaskStatus.ready,
          pwd: onof == '1' ? pwd : '',
          folderPath: folderDir,
          size: options.size,
        },
      ],
    }

    makeSizeStatus(info)
    console.log(info)
    this.list.push(info)
  }

  /**
   * 新增分享文件任务
   */
  async addShareFileTask(options: {url: string; pwd?: string}) {
    const {url} = options
    const folderDir = this.getFileDir()
    // if (options.onof === '1' && !options.pwd) {
    //   throw new Error('onof = 1 的情况下密码不能为空！')
    // } else if (options.onof === '0' && options.pwd) {
    //   options.pwd = ''
    // }
    const {name, size} = await downloadPageInfo(options)
    const task: DownloadInfo = {
      folderPath: folderDir,
      // status: InitStatus.notInit,
      ...options,
      name,
      tasks: [
        {
          url,
          name,
          resolve: 0,
          status: TaskStatus.ready,
          pwd: options.pwd,
          folderPath: folderDir,
          size: sizeToByte(size),
        },
      ],
    }
    makeSizeStatus(task)
    this.list.push(task)
  }

  /**
   * 下载列表文件夹文件
   * @param options
   */
  async addFolderTask(options: {folder_id: FolderId; name: string; merge?: boolean}) {
    let folderDir = this.getFileDir()
    const [detail, files] = await Promise.all([folderDetail(options.folder_id), lsFile(options.folder_id)])
    const info: DownloadInfo = {
      folderPath: folderDir,
      url: detail.is_newd,
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
        folderPath: folderDir,
        size: sizeToByte(files[index]?.size),
      }))
    )

    makeSizeStatus(info)
    this.list.push(info)
  }

  /**
   * 下载分享文件夹
   * merge: 自动合并下载文件
   */
  async addShareFolderTask(options: {url: string; pwd?: string; merge?: boolean}) {
    const {is_newd} = parseUrl(options.url)
    let folderDir = this.getFileDir()
    const info: DownloadInfo = {
      folderPath: folderDir,
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
      ...list.map(item => ({
        url: `${is_newd}/${item.id}`,
        name: item.name_all,
        resolve: 0,
        status: TaskStatus.ready,
        pwd: '',
        folderPath: folderDir,
        size: sizeToByte(item.size),
      }))
    )

    makeSizeStatus(info)
    this.list.push(info)
  }
}

const download = new Download()

export default download
