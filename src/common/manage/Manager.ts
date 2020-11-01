export enum TaskStatus {
  pause,
  pending,
  finish,
  fail // 文件夹被删除可导致任务失败
}

export default interface Manager<Task> {
  readonly queue: number;

  tasks: {[key: string]: Task}

  addTask(...args)

  start(...args)

  startAll()

  pause(...args)

  pauseAll()

  remove(...args)

  removeAll()
}

