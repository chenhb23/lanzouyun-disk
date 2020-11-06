export enum InitStatus {
  notInit,
  pending,
  finish,
}

export enum TaskStatus {
  ready,
  pending,
  finish,
  fail,
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
