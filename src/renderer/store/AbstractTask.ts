export enum InitStatus {
  notInit,
  pending,
  finish,
}

export enum TaskStatus {
  ready,
  pause,
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

export type TaskBase = {tasks: {size: number; resolve: number; status: TaskStatus}[]}

export function makeGetterProps<T extends {tasks: {size: number; resolve: number; status: TaskStatus}[]}>(info: T) {
  Object.defineProperties(info, {
    size: {
      get() {
        return this.tasks.reduce((total, item) => total + (item.size ?? 0), 0)
      },
    },
    resolve: {
      get() {
        return this.tasks.reduce((total, item) => total + (item.resolve ?? 0), 0)
      },
    },
    status: {
      get() {
        if (this.tasks.some(item => item.status === TaskStatus.pending)) return TaskStatus.pending
        return TaskStatus.ready
      },
    },
  })
}

// export function getInfoSize(info: TaskBase) {
//   return info.tasks.reduce((total, item) => total + (item.size ?? 0), 0)
// }
// export function getInfoResolve(info: TaskBase) {
//   return info.tasks.reduce((total, item) => total + (item.resolve ?? 0), 0)
// }
// export function getInfoStatus(info: TaskBase) {
//   if (info.tasks.some(item => item.status === TaskStatus.pending)) return TaskStatus.pending
//   return TaskStatus.ready
// }
