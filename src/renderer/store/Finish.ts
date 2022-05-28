import {DownloadTask} from './task/DownloadTask'
import {UploadTask} from './task/UploadTask'
import {SyncTask} from './task/SyncTask'
import {makeAutoObservable} from 'mobx'
import {persist} from 'mobx-persist'

export class Finish {
  @persist('list') downloadList: DownloadTask[] = []
  @persist('list') uploadList: UploadTask[] = []
  @persist('list') syncList: SyncTask[] = []

  constructor() {
    makeAutoObservable(this)
  }
}

export const finish = new Finish()
