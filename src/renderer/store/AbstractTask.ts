export enum TaskStatus {
  ready, // 等待中
  pause, // 已经暂停
  pending, // 进行中
  finish, // 已完成
  fail, // 下载失败
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
