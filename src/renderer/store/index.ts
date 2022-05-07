import {configure} from 'mobx'
import {create} from 'mobx-persist'
import {Upload, UploadTask} from './Upload'
import {Download, DownloadTask} from './Download'
import {TaskStatus} from './AbstractTask'
import {config} from './Config'

configure({
  enforceActions: 'never',
})

export const hydrate = create({
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

// 合理做法：合并完再初始化的，但目前没遇到什么问题
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

hydrate('config', config, (window as any).__STATE__?.config)
