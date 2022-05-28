export interface BaseTask {
  // 返回 false 或者 reject 停止
  beforeAddTask(): boolean | Promise<any>

  initTask()

  getStream(...args: any[])

  finishTask()
}
