import {configure} from 'mobx'
import {create} from 'mobx-persist'
import {Upload, UploadTask} from './Upload'
import {Download, DownloadTask} from './Download'
import {TaskStatus} from './AbstractTask'

configure({
  enforceActions: 'never',
})

const hydrate = create({
  storage: localStorage,
  debounce: 200,
})

export const upload = new Upload()
export const download = new Download()

function makePause<T extends {tasks: {status: TaskStatus}[]}>(task: T) {
  task.tasks.forEach(task => {
    if (task.status === TaskStatus.pending) {
      task.status = TaskStatus.pause
    }
    return task
  })
  return task
}

hydrate('download', download, (window as any).__STATE__?.download).then(value => {
  value.list = value.list.map(item => {
    const task = makePause(item)
    return new DownloadTask(task)
  })
  value.finishList = value.finishList.map(item => {
    const task = makePause(item)
    return new DownloadTask(task)
  })
})
hydrate('upload', upload, (window as any).__STATE__?.upload).then(value => {
  value.list = value.list.map(item => {
    const task = makePause(item)
    return new UploadTask(task)
  })
})
