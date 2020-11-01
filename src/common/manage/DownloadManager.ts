import Manager from "./Manager";

interface DownloadTask {}

export default class DownloadManager implements Manager<DownloadTask> {
  addTask(args) {
  }

  remove(args) {
  }

  removeAll() {
  }

  pause(args) {
  }

  pauseAll() {
  }

  start(args) {
  }

  startAll() {
  }

  get queue(): number {
    return 0;
  }

  tasks: { [p: string]: DownloadTask };

}
