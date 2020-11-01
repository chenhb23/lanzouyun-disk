import requireModule from "../../main/requireModule";
import Manager, {TaskStatus} from "./Manager";
import {getFileDetail, parseTargetUrl, sendDownloadTask} from "../file/download";
import {lsFile} from "../file/ls";
import {delay, mkTempDirSync} from "../util";
import merge from "../merge";

const electron = requireModule('electron')
const fs = requireModule('fs-extra')
const path = requireModule('path')

type AddTask = {
  fileId: FileId // id
  fileName: string // name_all
} | {
  folderId: FolderId // fol_id
  fileName: string // name
}

export interface DownloadTask {
  readonly taskCount: number,
  readonly resolve: number

  fileName: string // fileName 与 folderId 联合 id
  id: FolderId // id | fol_id
  isFile: boolean
  initial?: boolean
  fileDir: string // 文件真实保存目录 fileDir + fileName（有默认路径）
  subTasks: SubDownloadTask[]
}

export interface SubDownloadTask {
  resolve: number
  tempDir: string // 文件临时保存目录
  name: string // 显示到列表
  is_newd: string // 分享域名：is_newd
  f_id: string // 分享：f_id
  status: TaskStatus, // 暂停下载需重新解析下载链接
  // pwd: string // todo: 支持密码下载
}

export class DownloadManager implements Manager<DownloadTask> {
  tasks: { [p: string]: DownloadTask } = {}

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
      if (task.isFile) {
        this.remove(id)
      } else {
        // 合并文件
        const tempDir = task.subTasks[0].tempDir
        console.log(tempDir)
        const files = fs.readdirSync(tempDir)
        await merge(files, path.resolve(task.fileDir, task.fileName))
        await delay(200)
        // 删除临时文件夹
        fs.removeSync(tempDir)
      }
    }

    const tasks = Object.keys(this.tasks)[0]
    if (tasks) {
      this.start(tasks);
    }
  }

  /**
   * 下载的初始化在这里触发
   * @param task
   */
  addTask(task: AddTask) {
    const isFile = 'fileId' in task
    const id = 'fileId' in task ? task.fileId : task.folderId

    const downloadTask = {
      get taskCount() {
        return this.subTasks.filter(item => item.status === TaskStatus.pending).length
      },
      get resolve() {
        return this.subTasks.reduce((total, item) => total + item.resolve, 0)
      },
      fileName: task.fileName,
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
    if (task = this.tasks[id]) {
      if (!task.initial) {
        await this.genSubTask(id)
      }
      const subTask = task.subTasks.find(item => [TaskStatus.pause, TaskStatus.fail].includes(item.status))
      if (subTask) {
        if (!this.checkTaskQueue()) return

        subTask.status = TaskStatus.pending
        const downloadUrl = await parseTargetUrl(subTask)
        const replyId = subTask.f_id
        const ipcMessage: IpcDownloadMsg = {
          replyId,
          downUrl: downloadUrl,
          folderPath: subTask.tempDir,
        }

        await sendDownloadTask(ipcMessage)
        electron.ipcRenderer.on(`progressing${replyId}`, receivedByte => {
          subTask.resolve = receivedByte
        })
        electron.ipcRenderer.on(`done${replyId}`, () => {
          subTask.status = TaskStatus.finish
          this.checkTaskFinish(id)
        })
        electron.ipcRenderer.on(`failed${replyId}`, () => {
          subTask.status = TaskStatus.fail
        })

        await delay()
        this.start(id)
        // electron.ipcRenderer.send('download', downloadUrl, folderPath)
      }
    }
  }

  startAll() {
  }

  remove(id) {
    console.log(`删除: ${id}`)
    delete this.tasks[id]
  }

  removeAll() {
  }

  pause(args) {
  }

  pauseAll() {
  }

  async genSubTask(id: FileId) {
    const task = this.tasks[id]
    if (task.isFile) {
      const info = await getFileDetail(task.id);
      task.subTasks.push({
        resolve: 0,
        tempDir: task.fileDir,
        name: task.fileName,
        is_newd: info.is_newd, // todo: 生成 url
        f_id: info.f_id,
        status: TaskStatus.pause,
      });
    } else {
      // 创建临时目录
      const tempDir = mkTempDirSync()
      const files = await lsFile(task.id)
      const fileInfos = await Promise.all(files.map(file => getFileDetail(file.id)))
      const subTasks = fileInfos.map((info, index) => ({
        resolve: 0,
        tempDir,
        name: files[index].name_all,
        is_newd: info.is_newd, // todo: 生成 url
        f_id: info.f_id,
        status: TaskStatus.pause,
      }))
      task.subTasks.push(...subTasks)
    }
  }
}

export const downloadManager = new DownloadManager()
