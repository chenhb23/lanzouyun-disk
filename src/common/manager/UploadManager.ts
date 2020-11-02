import {makeAutoObservable} from 'mobx'
import Manager, {TaskStatus} from './Manager'
import requireModule from '../requireModule'
import {isExistByName} from '../file/isExist'
import {mkdir} from '../file/mkdir'
import split from '../split'
import request from '../request'
import {createUploadForm} from '../file/upload'
import {debounce, delay} from '../util'
import config from '../../project.config'

const fs = requireModule('fs-extra')
const path = requireModule('path')

interface AddTask {
  filePath: string // 作为 ID
  folderId: FolderId
  size: number
  fileName: string
  type: string
}

export interface UploadTask extends AddTask {
  readonly taskCount: number
  readonly resolve: number

  // filePath: string // 作为 ID
  // size: number
  // fileName: string
  // folderId: string

  initial?: boolean
  subTasks: SubUploadTask[]
}

export interface SubUploadTask {
  size: number
  type: string
  status: TaskStatus
  resolve: number

  fileName: string
  filePath: string
  folderId: FolderId
  startByte?: number
  endByte?: number
}

/**
 * todo：队列系统待完善
 */
export class UploadManager implements Manager<UploadTask> {
  constructor() {
    makeAutoObservable(this)
  }

  tasks: {[key: string]: UploadTask} = {}

  get queue() {
    return Object.keys(this.tasks).reduce((total, key) => total + this.tasks[key].taskCount, 0)
  }

  checkTaskQueue() {
    return this.queue <= 3
  }

  checkTaskFinish(id: string) {
    if (this.tasks[id]?.subTasks.every(item => item.status === TaskStatus.finish)) {
      this.remove(id)
    }

    const tasks = Object.keys(this.tasks)[0]
    if (tasks) {
      this.start(tasks)
    }
  }

  /**
   * 添加有可能会删除，这时候并不需要检查文件夹
   */
  addTask(task: OptionProps<AddTask, 'size' | 'fileName'>) {
    console.log(`任务被添加: ${task.filePath}`)
    // todo: 检查是否存在上传的任务
    // todo: 检查特殊符合: ()（）
    const uploadTask = {
      ...task,
      get taskCount() {
        return this.subTasks.filter(item => item.status === TaskStatus.pending).length
      },
      get resolve() {
        return this.subTasks.reduce((total, item) => total + item.resolve, 0)
      },
      subTasks: [],
    } as UploadTask

    const id = uploadTask.filePath
    if (!uploadTask.size) {
      uploadTask.size = fs.statSync(id).size
    }
    if (!uploadTask.fileName) {
      uploadTask.fileName = path.basename(id)
    }
    this.tasks[id] = uploadTask
    // todo: 自动触发任务
    this.start(id)
  }

  /**
   * 1、 未初始化：
   * * 生成子任务
   * 2、开始子任务
   * * 检查是否有上传的文件夹
   */
  async start(id: string) {
    let task: UploadTask
    if ((task = this.tasks[id])) {
      if (!task.initial) {
        await this.genSubTask(task.filePath)
      }
      const subTask = this.tasks[id].subTasks.find(item => [TaskStatus.pause, TaskStatus.fail].includes(item.status))
      if (subTask) {
        // 更新上传状态前， check status
        if (!this.checkTaskQueue()) return

        console.log('==开始任务：==', task, subTask)
        // 更新上传状态
        subTask.status = TaskStatus.pending

        const fr = fs.createReadStream(
          subTask.filePath,
          subTask.endByte
            ? {
                start: subTask.startByte,
                end: subTask.endByte,
              }
            : undefined
        )

        const form = createUploadForm({
          fr,
          size: subTask.size,
          name: subTask.fileName,
          folderId: subTask.folderId,
          id: subTask.fileName,
          type: subTask.type,
        })

        const updateResolve = debounce(bytes => {
          subTask.resolve = bytes
        })

        request<Do1Res, any>({
          path: '/fileup.php',
          body: form,
          onData: updateResolve,
        })
          .then(value => {
            if (value.zt === 1) {
              subTask.status = TaskStatus.finish
              this.checkTaskFinish(id)
            } else {
              console.log(value.info)
              subTask.status = TaskStatus.fail
            }
          })
          .catch(reason => {
            console.log(reason)
            subTask.status = TaskStatus.fail
          })

        await delay(300)
        this.start(id)
      }
    }
  }

  startAll() {}

  /**
   * todo: 先停止上传任务再删除任务
   */
  remove(id: string) {
    delete this.tasks[id]
  }

  removeAll() {}

  pause(...args) {}

  pauseAll() {}

  async genSubTask(id: string) {
    const task = this.tasks[id]
    const splitData = await split(task.filePath, {fileSize: task.size, skipSplit: true})

    let type = task.type
    if (config.supportList.every(item => !task.filePath.endsWith(`.${item}`))) {
      type = ''
    }

    if (splitData.isFile) {
      this.tasks[id].subTasks = [
        {
          size: task.size,
          status: TaskStatus.pause,
          resolve: 0,
          filePath: task.filePath,
          folderId: task.folderId,
          fileName: task.fileName,
          type,
        },
      ]
    } else {
      // todo: 检查目录的生成
      let subFolderId = await isExistByName(task.folderId, task.fileName).then(value => value?.fol_id)
      if (!subFolderId) {
        subFolderId = await mkdir(task.folderId, task.fileName)
      }
      this.tasks[id].subTasks = splitData.splitFiles.map(file => ({
        size: file.size,
        status: TaskStatus.pause,
        resolve: 0,
        filePath: task.filePath,
        folderId: subFolderId,
        fileName: file.name,
        startByte: file.startByte,
        endByte: file.endByte,
        type,
      }))
    }

    this.tasks[id].initial = true
  }
}

export const uploadManager = new UploadManager()
