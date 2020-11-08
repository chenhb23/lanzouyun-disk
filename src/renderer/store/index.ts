import {create} from 'mobx-persist'
import {Upload} from './Upload'
import {Download} from './Download'
import {makeGetterProps, TaskBase, TaskStatus} from './AbstractTask'

const hydrate = create({
  storage: localStorage,
  debounce: 200,
})

export const upload = new Upload()
export const download = new Download()

function makeReady<T extends {list: B; finishList?: B}, B extends TaskBase[]>(value: T) {
  value?.list?.forEach(info => {
    makeGetterProps(info)
    info.tasks.forEach(task => {
      if (task.status === TaskStatus.pending) {
        task.status = TaskStatus.pause
      }
    })
  })
  value?.finishList?.forEach(makeGetterProps)
}

hydrate('download', download, (window as any).__STATE__?.download).then(makeReady)
hydrate('upload', upload, (window as any).__STATE__?.upload).then(makeReady)
