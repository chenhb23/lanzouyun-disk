export enum TaskStatus {
  ready, // 等待中
  pause, // 已暂停
  pending, // 进行中
  finish, // 已完成
  fail, // 下载失败
}

export const TaskStatusName = {
  [TaskStatus.ready]: '等待中',
  [TaskStatus.pause]: '已暂停',
  [TaskStatus.pending]: '进行中',
  [TaskStatus.finish]: '已完成',
  [TaskStatus.fail]: '下载失败',
}

export default interface Task<Info> {
  readonly queue: number

  list: Info[]

  start(...args)

  startAll()

  pause(...args)

  pauseAll()

  remove(...args)

  removeAll()
}
