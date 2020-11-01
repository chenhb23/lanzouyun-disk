import {UploadStatus, UploadTask} from "./UploadManager";

// export default abstract class Manager<Task> {
//   abstract get queue(): number;
//
//   tasks: {[key: string]: Task} = {}
//
//   abstract addTask(...args)
//
//   abstract start(...args)
//
//   abstract startAll()
//
//   abstract pause(...args)
//
//   abstract pauseAll()
//
//   abstract del(...args)
//
//   abstract delAll()
// }
//

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
