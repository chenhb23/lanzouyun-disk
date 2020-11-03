import requireModule from '../requireModule'
import Manager, {TaskStatus} from './Manager'
import {getFileDetail, parseTargetUrl, sendDownloadTask} from '../core/download'
import {lsFile} from '../core/ls'
import {delay, isSpecificFile, mkTempDirSync, restoreFileName, sizeToByte} from '../util'
import merge from '../merge'
import {makeAutoObservable} from 'mobx'

const electron = requireModule('electron')
const fs = requireModule('fs-extra')
const path = requireModule('path')

type AddTask = {
  id: string | number
  fileName: string
  // size?: number
  isFile?: boolean // 默认 true
}

export interface DownloadTask {
  readonly taskCount: number
  readonly resolve: number
  readonly size: number

  fileName: string // fileName 与 folderId 联合 id
  id: FolderId // id | fol_id
  isFile: boolean
  initial?: boolean
  fileDir: string // 文件真实保存目录 fileDir + fileName（有默认路径）
  subTasks: SubDownloadTask[]
}

export interface SubDownloadTask {
  id: FileId
  resolve: number
  tempDir: string // 文件临时保存目录
  name: string // 显示到列表
  is_newd: string // 分享域名：is_newd
  f_id: string // 分享：f_id
  size: number
  status: TaskStatus // 暂停下载需重新解析下载链接
  // pwd: string // todo: 支持密码下载
}

/**
 * 优化多任务下载，防止抢占资源的现象
 */
export class DownloadManager implements Manager<DownloadTask> {
  constructor() {
    makeAutoObservable(this)
  }

  tasks: {[p: string]: DownloadTask} = {}

  get queue(): number {
    return Object.keys(this.tasks).reduce((total, key) => total + this.tasks[key].taskCount, 0)
  }

  checkTaskQueue() {
    return this.queue <= 3
  }

  async checkTaskFinish(id) {
    const task = this.tasks[id]
    console.log('checkTaskFinish', task.fileName)
    if (task.subTasks.every(item => item.status === TaskStatus.finish)) {
      const targetDir = path.resolve(task.fileDir, task.fileName)

      if (!task.isFile) {
        // 合并文件
        const tempDir = task.subTasks[0].tempDir
        console.log(tempDir)
        const files = fs.readdirSync(tempDir).map(item => path.resolve(tempDir, item))
        console.log('files', files)
        await merge(files, targetDir)
        await delay(200)
        // 删除临时文件夹
        fs.removeSync(tempDir)
      } else {
        if (isSpecificFile(task.fileName)) {
          fs.renameSync(targetDir, restoreFileName(targetDir))
        }
      }

      this.remove(id)
    }

    const tasks = Object.keys(this.tasks)[0]
    if (tasks) {
      this.start(tasks)
    }
  }

  /**
   * 下载的初始化在这里触发
   */
  addTask({isFile = true, ...task} = {} as AddTask) {
    const id = task.id
    const fileName = task.fileName

    const downloadTask = {
      get taskCount() {
        return this.subTasks.filter(item => item.status === TaskStatus.pending).length
      },
      get resolve() {
        return this.subTasks.reduce((total, item) => total + item.resolve, 0)
      },
      get size() {
        return this.subTasks.reduce((total, item) => total + item.size, 0)
      },
      fileName,
      id,
      isFile,
      initial: false,
      fileDir: '/Users/chb/Desktop/tempDownload', // todo: 选择默认 dir
      subTasks: [],
    } as DownloadTask

    this.tasks[id] = downloadTask
    this.start(id)
  }

  async start(id: FileId) {
    let task: DownloadTask
    if ((task = this.tasks[id])) {
      if (!task.initial) {
        await this.genSubTask(id)
      }
      const subTask = task.subTasks.find(item => [TaskStatus.pause, TaskStatus.fail].includes(item.status))
      if (subTask) {
        if (!this.checkTaskQueue()) return

        console.log('start task:======================', subTask.id, subTask.name)
        subTask.status = TaskStatus.pending

        const downloadUrl = await parseTargetUrl(subTask)
        const replyId = `${subTask.id}`
        const ipcMessage: IpcDownloadMsg = {
          replyId,
          downUrl: downloadUrl,
          folderPath: subTask.tempDir,
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
            subTask.resolve = receivedByte
          })
          .once(`done${replyId}`, () => {
            console.log('done', subTask.name)
            subTask.status = TaskStatus.finish
            this.checkTaskFinish(id)
            removeListener()
          })
          .once(`failed${replyId}`, () => {
            subTask.status = TaskStatus.fail
            removeListener()
          })

        // await delay()
        this.start(id)
      }
    }
  }

  setListener() {}

  startAll() {}

  remove(id) {
    delete this.tasks[id]
  }

  removeAll() {}

  pause(args) {}

  pauseAll() {}

  async genSubTask(id: FileId) {
    const task = this.tasks[id]
    if (task.isFile) {
      const info = await getFileDetail(task.id)
      task.subTasks.push({
        id: task.id,
        resolve: 0,
        tempDir: task.fileDir,
        name: task.fileName,
        is_newd: info.is_newd, // todo: 生成 url
        f_id: info.f_id,
        status: TaskStatus.pause,
        size: 0, //  todo
      })
    } else {
      // 创建临时目录
      const tempDir = mkTempDirSync()
      const files = await lsFile(task.id)
      const fileInfos = await Promise.all(files.map(file => getFileDetail(file.id)))
      const subTasks = fileInfos.map((info, index) => ({
        id: files[index].id,
        resolve: 0,
        tempDir,
        name: files[index].name_all,
        is_newd: info.is_newd, // todo: 生成 url
        f_id: info.f_id,
        status: TaskStatus.pause,
        size: sizeToByte(files[index].size),
      }))
      task.subTasks.push(...subTasks)
    }

    task.initial = true
  }
}

export const downloadManager = new DownloadManager()
