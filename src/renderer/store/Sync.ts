import EventEmitter from 'events'
import fs from 'fs-extra'
import path from 'path'
import {autorun, makeObservable, observable} from 'mobx'
import Task, {TaskStatus} from './AbstractTask'
import {download, upload} from './index'
import {UploadLinkTask} from './task/UploadLinkTask'
import {SyncTask} from './task/SyncTask'
import electronApi from '../electronApi'
import {finish} from './Finish'

export class Sync extends EventEmitter implements Task<SyncTask> {
  // todo: 持久化
  list: SyncTask[] = []

  constructor() {
    super()
    makeObservable(this, {
      list: observable,
    })

    process.nextTick(this.init)
  }

  private init = () => {
    // autorun(
    //   () => {
    //     this.list.length && this.checkTask()
    //   },
    //   {delay: 300}
    // )
    download.on('finish', async info => {
      const task = this.list.find(value => value.download.url === info.url)
      if (task) {
        const filePath = path.join(info.dir, info.name)
        const stat = await fs.stat(filePath)
        const uploadTask = new UploadLinkTask({
          folderId: task.folderId,
          file: {
            size: stat.size,
            name: info.name,
            type: '',
            path: filePath,
            lastModified: stat.mtime.getTime(),
          },
        })
        task.upload = uploadTask
        await upload.addTask(uploadTask)
      }
    })

    upload.on('finish', async info => {
      const task = this.list.find(value => value.upload.file.path === info.file.path)
      if (task) {
        this.list = this.list.filter(value => value.uid !== task.uid)
        finish.syncList.push(task)
        if (task.trashOnFinish) {
          await electronApi.trashItem(path.join(task.download.dir, task.download.name))
        }
      }
    })
  }

  // checkTask() {
  //   const task = this.list.find(value => value.status === TaskStatus.ready)
  //   if (task) {
  //     this.start(task.uid)
  //   }
  // }

  get queue() {
    return this.list.filter(value => value.status === TaskStatus.pending).length
  }

  pause(uid: string) {
    const task = this.list.find(value => value.uid === uid)
    if (task) {
      switch (task.step) {
        case 'download':
          return download.pause(task.download.url)
        case 'upload':
          return upload.pause(task.upload.file.path)
      }
    }
  }

  pauseAll() {
    this.list.forEach(item => this.pause(item.uid))
  }

  remove(uid: string) {
    const task = this.list.find(value => value.uid === uid)
    if (task) {
      this.pause(task.uid)
      switch (task.step) {
        case 'upload':
          upload.remove(task.upload.file.path)
          break
        case 'download':
          download.remove(task.download.url)
          break
      }
      this.list = this.list.filter(value => value.uid !== uid)
    }
  }

  removeAll() {
    this.list.forEach(info => this.remove(info.uid))
    this.list = []
  }

  // todo: 暂停后，重新开始还有问题
  async start(uid: string, reset = false) {
    const task = this.list.find(value => value.uid === uid)
    if (!task) return

    switch (task.step) {
      case 'download': {
        await download.start(task.download.url, reset)
        // if (download.list.some(value => value.url === task.download.url)) {
        // } else {
        //   await download.addTask(task.download)
        // }
        break
      }
      case 'upload': {
        await upload.start(task.upload.file.path, reset)
        // if (upload.list.some(value => value.file.path === task.upload.file.path)) {
        // } else {
        //   await upload.addTask(task.upload)
        // }
        break
      }
    }
  }

  async startAll() {
    for (const value of this.list) {
      await this.start(value.uid, true)
    }
  }

  // async addTask(downloadTask: DownloadLinkTask) {
  async addTask(task: SyncTask) {
    await task.beforeAddTask()
    // await downloadTask.beforeAddTask()
    // const task = new SyncTask({
    //   download: downloadTask,
    // })
    this.list.push(task)
    await download.addTask(task.download)
  }
}

export const sync = new Sync()
