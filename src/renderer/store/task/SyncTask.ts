import {makeAutoObservable} from 'mobx'
import {DownloadTask} from './DownloadTask'
import {UploadTask} from './UploadTask'

export class SyncTask {
  uid: string

  constructor(props: Partial<SyncTask> = {}) {
    makeAutoObservable(this)
    Object.assign(this, {uid: `${Date.now()}`}, props)
  }

  get step(): 'download' | 'upload' {
    // upload 优先
    if (this.upload) return 'upload'
    if (this.download) return 'download'
  }

  // set step(value) {
  //   // pass
  // }

  folderId: FolderId

  // 任务完成后，删除源文件
  trashOnFinish: boolean

  download: DownloadTask
  upload: UploadTask

  get size() {
    switch (this.step) {
      case 'download':
        return this.download.total
      case 'upload':
        return this.upload.size
    }
  }

  get resolve() {
    switch (this.step) {
      case 'download':
        return this.download.resolve
      case 'upload':
        return this.upload.resolve
    }
    // return this.tasks.reduce((total, item) => total + (item.resolve ?? 0), 0)
  }

  get status() {
    switch (this.step) {
      case 'download':
        return this.download.status
      case 'upload':
        return this.upload.status
    }
  }

  beforeAddTask() {
    return this.download.beforeAddTask()
  }
}
